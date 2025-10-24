import { defineCollection, z } from "astro:content";
import { load as loadIncidents } from "./loaders/incidents-loader";
import { load as loadSubmissions } from "./loaders/submissions-loader";

const incidents = defineCollection({
  loader: async () => await loadIncidents(),
  schema: z.object({
    id: z.string(),
    submissionId: z.string(),
    civlEventId: z.string(),
    taskNumber: z.number(),
    affectedPersons: z.string(),
    injuries: z.string(),
    damages: z.string(),
    incidentDescription: z.string(),
    directCause: z.string(),
    context: z.string(),
    weatherConditions: z.string(),
    timeFrame: z.string(),
    actionsTaken: z.string(),
    opinions: z.string(),
  }),
});

const submissions = defineCollection({
  loader: async () => await loadSubmissions(),
  schema: z.object({
    id: z.string(),
    createdAt: z.string(),
    status: z.enum(["submitted", "processing", "processed", "rejected"]),
    feedback: z.string(),
    incidentsIds: z.array(z.string()),
  }),
});

export const collections = {
  incidents,
  submissions,
};
