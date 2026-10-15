-- Tenant isolation policies for PostgreSQL. Keep app.system server-only: it is set by trusted webhook/system code.
CREATE OR REPLACE FUNCTION app_is_system() RETURNS boolean
LANGUAGE sql STABLE AS $$ SELECT current_setting('app.system', true) = 'true' $$;

CREATE OR REPLACE FUNCTION app_is_active_member(p_workspace uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (
    SELECT 1 FROM "WorkspaceMember" m
    WHERE m."workspaceId" = p_workspace
      AND m."userId" = nullif(current_setting('app.user_id', true), '')::uuid
      AND m.status = 'ACTIVE'
  )
$$;

CREATE OR REPLACE FUNCTION app_is_workspace_owner(p_workspace uuid,p_user uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (SELECT 1 FROM "Workspace" w WHERE w.id=p_workspace AND w."ownerId"=p_user)
$$;

CREATE OR REPLACE FUNCTION app_can_access_channel(p_channel uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
 SELECT EXISTS (
   SELECT 1 FROM "Channel" c
   WHERE c.id = p_channel AND (
     NOT c."isPrivate"
     OR c."createdById" = nullif(current_setting('app.user_id', true), '')::uuid
     OR EXISTS (SELECT 1 FROM "WorkspaceMember" m WHERE m."workspaceId"=c."workspaceId" AND m."userId"=nullif(current_setting('app.user_id', true), '')::uuid AND m.status='ACTIVE' AND m.role IN ('OWNER','ADMIN'))
   )
 )
$$;

CREATE OR REPLACE FUNCTION list_my_workspaces()
RETURNS TABLE(id uuid, name text, slug text, role text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
 SELECT w.id, w.name::text, w.slug::text, m.role::text
 FROM "WorkspaceMember" m JOIN "Workspace" w ON w.id=m."workspaceId"
 WHERE m."userId"=nullif(current_setting('app.user_id', true), '')::uuid AND m.status='ACTIVE'
 ORDER BY m."joinedAt"
$$;

CREATE OR REPLACE FUNCTION accept_workspace_invitation(p_token_hash text, p_user_id uuid)
RETURNS TABLE(workspace_id uuid, slug text, name text, role text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE inv "Invitation"%ROWTYPE; usr "User"%ROWTYPE; active_count integer; seat_limit integer; current_plan "Plan"; already_member boolean;
BEGIN
 IF nullif(current_setting('app.user_id', true), '')::uuid IS DISTINCT FROM p_user_id THEN RETURN; END IF;
 SELECT * INTO inv FROM "Invitation" i WHERE i."tokenHash"=p_token_hash FOR UPDATE;
 IF NOT FOUND OR inv."acceptedAt" IS NOT NULL OR inv."revokedAt" IS NOT NULL OR inv."expiresAt" <= now() THEN RETURN; END IF;
 SELECT * INTO usr FROM "User" u WHERE u.id=p_user_id;
 IF NOT FOUND OR lower(usr.email) <> lower(inv.email) THEN RETURN; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(inv."workspaceId"::text || ':members',0));
 SELECT EXISTS (SELECT 1 FROM "WorkspaceMember" m WHERE m."workspaceId"=inv."workspaceId" AND m."userId"=p_user_id AND m.status='ACTIVE') INTO already_member;
 IF NOT already_member THEN
   SELECT count(*) INTO active_count FROM "WorkspaceMember" m WHERE m."workspaceId"=inv."workspaceId" AND m.status='ACTIVE';
   SELECT COALESCE((SELECT s.plan FROM "Subscription" s WHERE s."workspaceId"=inv."workspaceId"), 'FREE'::"Plan") INTO current_plan;
   seat_limit := CASE current_plan WHEN 'FREE' THEN 10 WHEN 'PRO' THEN 100 ELSE 1000 END;
   IF active_count >= seat_limit THEN
     RETURN QUERY SELECT w.id,w.slug::text,w.name::text,'PLAN_LIMIT' FROM "Workspace" w WHERE w.id=inv."workspaceId";
     RETURN;
   END IF;
   INSERT INTO "WorkspaceMember" (id,"workspaceId","userId",role,status,"joinedAt")
   VALUES (gen_random_uuid(),inv."workspaceId",p_user_id,inv.role,'ACTIVE',now());
   INSERT INTO "AuditLog" (id,"workspaceId","actorId",action,"targetType","targetId","createdAt")
   VALUES (gen_random_uuid(),inv."workspaceId",p_user_id,'member.joined','member',p_user_id::text,now());
 END IF;
 UPDATE "Invitation" SET "acceptedAt"=now() WHERE id=inv.id;
 RETURN QUERY SELECT w.id,w.slug::text,w.name::text,inv.role::text FROM "Workspace" w WHERE w.id=inv."workspaceId";
END $$;

ALTER TABLE "Workspace" ENABLE ROW LEVEL SECURITY;
CREATE POLICY workspace_tenant_policy ON "Workspace"
USING (app_is_system() OR (id=nullif(current_setting('app.workspace_id',true),'')::uuid AND app_is_active_member(id)))
WITH CHECK (app_is_system() OR (id=nullif(current_setting('app.workspace_id',true),'')::uuid AND "ownerId"=nullif(current_setting('app.user_id',true),'')::uuid));

ALTER TABLE "WorkspaceMember" ENABLE ROW LEVEL SECURITY;
CREATE POLICY member_tenant_policy ON "WorkspaceMember"
USING (app_is_system() OR ("workspaceId"=nullif(current_setting('app.workspace_id',true),'')::uuid AND app_is_active_member("workspaceId")))
WITH CHECK (app_is_system() OR ("workspaceId"=nullif(current_setting('app.workspace_id',true),'')::uuid AND app_is_active_member("workspaceId")));
CREATE POLICY member_initial_owner_policy ON "WorkspaceMember" FOR INSERT
WITH CHECK ("workspaceId"=nullif(current_setting('app.workspace_id',true),'')::uuid AND "userId"=nullif(current_setting('app.user_id',true),'')::uuid AND role='OWNER' AND app_is_workspace_owner("workspaceId","userId"));

ALTER TABLE "Channel" ENABLE ROW LEVEL SECURITY;
CREATE POLICY channel_tenant_policy ON "Channel"
USING (app_is_system() OR ("workspaceId"=nullif(current_setting('app.workspace_id',true),'')::uuid AND app_is_active_member("workspaceId") AND (NOT "isPrivate" OR "createdById"=nullif(current_setting('app.user_id',true),'')::uuid OR EXISTS (SELECT 1 FROM "WorkspaceMember" m WHERE m."workspaceId"="Channel"."workspaceId" AND m."userId"=nullif(current_setting('app.user_id',true),'')::uuid AND m.role IN ('OWNER','ADMIN'))))
WITH CHECK (app_is_system() OR ("workspaceId"=nullif(current_setting('app.workspace_id',true),'')::uuid AND app_is_active_member("workspaceId")));

ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;
CREATE POLICY message_tenant_policy ON "Message"
USING (app_is_system() OR ("workspaceId"=nullif(current_setting('app.workspace_id',true),'')::uuid AND app_is_active_member("workspaceId") AND app_can_access_channel("channelId")))
WITH CHECK (app_is_system() OR ("workspaceId"=nullif(current_setting('app.workspace_id',true),'')::uuid AND app_is_active_member("workspaceId") AND app_can_access_channel("channelId")));

ALTER TABLE "Subscription" ENABLE ROW LEVEL SECURITY;
CREATE POLICY subscription_tenant_policy ON "Subscription"
USING (app_is_system() OR ("workspaceId"=nullif(current_setting('app.workspace_id',true),'')::uuid AND app_is_active_member("workspaceId")))
WITH CHECK (app_is_system() OR ("workspaceId"=nullif(current_setting('app.workspace_id',true),'')::uuid AND app_is_active_member("workspaceId")));

ALTER TABLE "Invitation" ENABLE ROW LEVEL SECURITY;
CREATE POLICY invitation_tenant_policy ON "Invitation"
USING (app_is_system() OR ("workspaceId"=nullif(current_setting('app.workspace_id',true),'')::uuid AND app_is_active_member("workspaceId")))
WITH CHECK (app_is_system() OR ("workspaceId"=nullif(current_setting('app.workspace_id',true),'')::uuid AND app_is_active_member("workspaceId")));

ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_tenant_policy ON "AuditLog"
USING (app_is_system() OR ("workspaceId"=nullif(current_setting('app.workspace_id',true),'')::uuid AND app_is_active_member("workspaceId")))
WITH CHECK (app_is_system() OR ("workspaceId"=nullif(current_setting('app.workspace_id',true),'')::uuid AND app_is_active_member("workspaceId")));

REVOKE ALL ON FUNCTION accept_workspace_invitation(text,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION accept_workspace_invitation(text,uuid) TO PUBLIC;
