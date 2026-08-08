"use client";

import { useParams, useRouter } from "next/navigation";
import { useProjects } from "@/lib/api";
import { useEffect } from "react";

export default function ProjectsIndexPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  const { data: projects, isLoading } = useProjects(workspaceId);

  useEffect(() => {
    if (!isLoading && projects?.length > 0) {
      router.replace(`/${workspaceId}/projects/${projects[0].id}/board`);
    }
  }, [projects, isLoading, workspaceId, router]);

  return (
    <div className="flex h-full items-center justify-center">
      {isLoading ? (
        <div className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      ) : (
        <div className="text-center text-[var(--muted-foreground)]">
          <p className="text-lg font-semibold mb-2">No projects yet</p>
          <p className="text-sm">
            Click the + next to Projects in the sidebar to create one.
          </p>
        </div>
      )}
    </div>
  );
}
