interface Submission {
  id: number;
  submissionAt: string;
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
    submissionAt: "2024-01-15T14:30:00Z",
    status: "processed",
    feedback:
      "Thank you for your detailed report. The incident has been reviewed and appropriate measures have been taken.",
    incidentsIds: [1],
  },
  {
    id: 2,
    submissionAt: "2024-01-15T11:20:00Z",
    status: "processed",
    feedback:
      "Your feedback regarding the turbulent conditions has been noted. We will review the route for future tasks.",
    incidentsIds: [1, 2],
  },
  {
    id: 3,
    submissionAt: "2024-01-16T09:45:00Z",
    status: "processing",
    feedback: "",
    incidentsIds: [],
  },
  {
    id: 4,
    submissionAt: "2024-01-16T16:20:00Z",
    status: "submitted",
    feedback: "",
    incidentsIds: [],
  },
  {
    id: 5,
    submissionAt: "2024-01-14T13:10:00Z",
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
