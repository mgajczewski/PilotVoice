interface Submission {
  id: number;
  createdAt: string;
  status: "submitted" | "processing" | "processed" | "rejected";
  feedback: string;
  incidentsIds: number[];
}

interface SubmissionDto extends Omit<Submission, "id" | "incidentsIds"> {
  id: string;
  incidentsIds: string[];
}

const mockSubmissions: Submission[] = [
  {
    id: 1,
    createdAt: "2024-01-15T14:30:00Z",
    status: "processed",
    feedback:
      "Your submission has been processed successfully. 1 incident was created. You can still add: weather conditions, time frame details, and additional context.",
    incidentsIds: [1],
  },
  {
    id: 2,
    createdAt: "2024-01-15T11:20:00Z",
    status: "processed",
    feedback:
      "Your submission has been processed successfully. 2 incidents were created. You can still add: actions taken and opinions from involved parties.",
    incidentsIds: [1, 2],
  },
  {
    id: 3,
    createdAt: "2024-01-16T09:45:00Z",
    status: "processing",
    feedback: "",
    incidentsIds: [],
  },
  {
    id: 4,
    createdAt: "2024-01-16T16:20:00Z",
    status: "submitted",
    feedback: "",
    incidentsIds: [],
  },
  {
    id: 5,
    createdAt: "2024-01-14T13:10:00Z",
    status: "rejected",
    feedback: "Submission was incomplete. Please provide all required information and resubmit.",
    incidentsIds: [],
  },
];

export async function load(): Promise<SubmissionDto[]> {
  // For now, return mock data. Later this can be replaced with actual data fetching
  return mockSubmissions.map((submission) => ({
    ...submission,
    id: submission.id.toString(),
    incidentsIds: submission.incidentsIds.map((id) => id.toString()),
  }));
}

export type { Submission, SubmissionDto };
