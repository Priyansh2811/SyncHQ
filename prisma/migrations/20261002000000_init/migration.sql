-- CreateEnum
CREATE TYPE "Role" AS ENUM ('OWNER', 'ADMIN', 'MEMBER', 'GUEST');

-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('ACTIVE', 'INVITED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('FREE', 'PRO', 'BUSINESS');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELED', 'INCOMPLETE');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "preferences" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workspace" (
    "id" UUID NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "slug" VARCHAR(50) NOT NULL,
    "ownerId" UUID NOT NULL,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceMember" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'MEMBER',
    "status" "MemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Channel" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "description" VARCHAR(500),
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Channel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "channelId" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    "clientId" VARCHAR(80),
    "content" VARCHAR(10000) NOT NULL,
    "editedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "plan" "Plan" NOT NULL DEFAULT 'FREE',
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'MEMBER',
    "tokenHash" TEXT NOT NULL,
    "inviterId" UUID NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaitlistEntry" (
    "id" UUID NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaitlistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "actorId" UUID,
    "action" VARCHAR(100) NOT NULL,
    "targetType" VARCHAR(60) NOT NULL,
    "targetId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactSubmission" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "subject" VARCHAR(160) NOT NULL,
    "message" VARCHAR(10000) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StripeEvent" (
    "id" TEXT NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StripeEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_expiresAt_idx" ON "Session"("userId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Workspace_slug_key" ON "Workspace"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Workspace_stripeCustomerId_key" ON "Workspace"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Workspace_stripeSubscriptionId_key" ON "Workspace"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "Workspace_ownerId_idx" ON "Workspace"("ownerId");

-- CreateIndex
CREATE INDEX "WorkspaceMember_workspaceId_status_idx" ON "WorkspaceMember"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "WorkspaceMember_userId_status_idx" ON "WorkspaceMember"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceMember_workspaceId_userId_key" ON "WorkspaceMember"("workspaceId", "userId");

-- CreateIndex
CREATE INDEX "Channel_workspaceId_idx" ON "Channel"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "Channel_workspaceId_slug_key" ON "Channel"("workspaceId", "slug");

-- CreateIndex
CREATE INDEX "Message_workspaceId_idx" ON "Message"("workspaceId");

-- CreateIndex
CREATE INDEX "Message_channelId_createdAt_idx" ON "Message"("channelId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Message_channelId_authorId_clientId_key" ON "Message"("channelId", "authorId", "clientId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_workspaceId_key" ON "Subscription"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeCustomerId_key" ON "Subscription"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_tokenHash_key" ON "Invitation"("tokenHash");

-- CreateIndex
CREATE INDEX "Invitation_workspaceId_expiresAt_idx" ON "Invitation"("workspaceId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_workspaceId_email_key" ON "Invitation"("workspaceId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_expiresAt_idx" ON "PasswordResetToken"("userId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "WaitlistEntry_email_key" ON "WaitlistEntry"("email");

-- CreateIndex
CREATE INDEX "AuditLog_workspaceId_createdAt_idx" ON "AuditLog"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "ContactSubmission_createdAt_idx" ON "ContactSubmission"("createdAt");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workspace" ADD CONSTRAINT "Workspace_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Channel" ADD CONSTRAINT "Channel_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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

