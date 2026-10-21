import "server-only";
import { cache } from "react";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";

export const getSettings = cache(async () => {
  const row = await db.query.settings.findFirst({ where: eq(schema.settings.id, 1) });
  return (
    row ?? {
      id: 1,
      brand: { name: "Avix" },
      mentorWhatsappE164: "+5527999749624",
      requireAiApproval: false,
      sessionTimeoutHours: 3,
      driveAutoOrganize: true,
      riskRules: { daysWithoutAccess: 10, overdueActions: 3, minRating: 2.5, missedSessions: 2 },
      distributionRules: { maxActionsPerDay: 3 },
      integrations: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  );
});
