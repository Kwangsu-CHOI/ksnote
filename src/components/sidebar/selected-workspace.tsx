"use client";

import { workspace } from "@/lib/supabase/supabase.types";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";

interface SelectedWorkspaceProps {
	workspace: workspace;
	onClick?: (option: workspace) => void;
}

const SelectedWorkspace: React.FC<SelectedWorkspaceProps> = ({
	workspace,
	onClick,
}) => {
	const supabase = createClientComponentClient();
	const [workspaceLogo, setWorkspaceLogo] = useState("/logo-dark.png");

	useEffect(() => {
		if (workspace.logo) {
			const path = supabase.storage
				.from("ksnote-logo")
				.getPublicUrl(workspace.logo)?.data.publicUrl;
			setWorkspaceLogo(path);
		}
	}, [workspace]);
	return (
		<Link
			href={`/dashboard/${workspace.id}`}
			onClick={() => {
				if (onClick) onClick(workspace);
			}}
			className="flex rounded-md transition-all flew-row p-2 gap-4 justify-center items-center cursor-pointer my-1"
		>
			<Image
				src={workspaceLogo}
				alt="workspace logo"
				width={21}
				height={21}
				objectFit="cover"
			/>
			<div className="flex flex-col">
				<p className="w-[170px] overflow-hidden overflow-ellipsis whitespace-nowrap">
					{workspace.title}
				</p>
			</div>
		</Link>
	);
};

export default SelectedWorkspace;
