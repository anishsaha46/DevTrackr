import React from "react";

interface ProjectCardProps {
  projectName: string;
  description: string;
  status: string;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ projectName, description, status }) => {
  return (
    <div className="border rounded-md p-4">
      <h3 className="text-lg font-semibold">{projectName}</h3>
      <p className="text-sm">{description}</p>
      <div>{status}</div>
    </div>
  );
};

export default ProjectCard;
