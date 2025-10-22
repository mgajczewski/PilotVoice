interface Incident {
  id: number;
  submissionId: number;
  civlEventId: number;
  taskNumber: number;
  affectedPersons: string;
  injuries: string;
  damages: string;
  incidentDescription: string;
  directCause: string;
  context: string;
  weatherConditions: string;
  timeFrame: string;
  actionsTaken: string;
  opinions: string;
}

interface IncidentDto extends Omit<Incident, "id" | "submissionId" | "civlEventId"> {
  id: string;
  submissionId: string;
  civlEventId: string;
}

const mockIncidents: Incident[] = [
  {
    id: 1,
    submissionId: 1,
    civlEventId: 1,
    taskNumber: 1,
    affectedPersons: "John Doe, Jane Smith",
    injuries: "Minor bruising, Sprained ankle",
    damages: "Damaged wing tip, Broken harness buckle",
    incidentDescription: "Mid-air collision during thermal climb",
    directCause: "Insufficient separation between pilots",
    context: "Strong thermal activity with multiple pilots converging",
    weatherConditions: "Clear skies, strong thermals, wind 15-20 km/h",
    timeFrame: "14:30 - 14:45",
    actionsTaken: "Emergency landing, First aid administered, Incident reported to organizers",
    opinions: "Better spacing rules needed, Radio communication could have prevented this",
  },
  {
    id: 2,
    submissionId: 2,
    civlEventId: 1,
    taskNumber: 2,
    affectedPersons: "Mike Johnson",
    injuries: "",
    damages: "Torn canopy",
    incidentDescription: "Wing collapse during turbulent conditions",
    directCause: "Unexpected rotor turbulence near ridge",
    context: "Flying close to terrain in strong wind conditions",
    weatherConditions: "Gusty winds, 25-30 km/h, turbulent",
    timeFrame: "11:15 - 11:20",
    actionsTaken: "Successful recovery, Precautionary landing",
    opinions: "Route should avoid this area in strong winds",
  },
];

export async function load(): Promise<IncidentDto[]> {
  // For now, return mock data. Later this can be replaced with actual data fetching
  return mockIncidents.map((incident) => ({
    ...incident,
    id: incident.id.toString(),
    submissionId: incident.submissionId.toString(),
    civlEventId: incident.civlEventId.toString(),
  }));
}

export type { Incident, IncidentDto };
