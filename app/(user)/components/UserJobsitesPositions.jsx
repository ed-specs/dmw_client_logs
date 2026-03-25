"use client";

import JobsitesPositionsView from "../../components/JobsitesPositionsView";

export default function UserJobsitesPositions({
  initialLogs = [],
  dbJobsites = [],
  dbPositions = [],
  userRole = "",
}) {
  return (
    <JobsitesPositionsView
      initialLogs={initialLogs}
      dbJobsites={dbJobsites}
      dbPositions={dbPositions}
      userRole={userRole}
      variant="user"
    />
  );
}
