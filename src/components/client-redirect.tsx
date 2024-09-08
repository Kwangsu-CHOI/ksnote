"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const ClientRedirect = ({ workspaceId }: { workspaceId: string }) => {
	const router = useRouter();

	useEffect(() => {
		router.push(`/dashboard/${workspaceId}`);
	}, [workspaceId, router]);

	return null;
};

export default ClientRedirect;
