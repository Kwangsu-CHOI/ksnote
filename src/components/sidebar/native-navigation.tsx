import Link from "next/link";
import React from "react";
import { twMerge } from "tailwind-merge";
import HomeIcon from "../icons/HomeIcon";
import TrashIcon from "../icons/TrashIcon";
import SettingsIcon from "../icons/SettingsIcon";
import Settings from "../settings/settings";
import Trash from "../trash/trash";

interface NativeNavigationProps {
	myWorkspaceId: string;
	className?: string;
}

const NativeNavigation: React.FC<NativeNavigationProps> = ({
	myWorkspaceId,
	className,
}) => {
	return (
		<nav className={twMerge("my-2", className)}>
			<ul className="flex flex-col gap-2">
				<li>
					<Link
						href={`/dashboard/${myWorkspaceId}/`}
						className="flex group/native text-Neutrals/neutrals-7 hover:text-foreground hover:font-semibold transition-all gap-2 items-center"
					>
						<HomeIcon />
						<span>My Workspace</span>
					</Link>
				</li>

				<Settings>
					<li className="flex group/native text-Neutrals/neutrals-7 hover:text-foreground hover:font-semibold transition-all gap-2 items-center cursor-pointer">
						<SettingsIcon />
						<span>Settings</span>
					</li>
				</Settings>
				<Trash>
					<li className="flex group/native text-Neutrals/neutrals-7 hover:text-foreground hover:font-semibold transition-all gap-2 items-center">
						<TrashIcon />
						<span>Trash</span>
					</li>
				</Trash>
			</ul>
		</nav>
	);
};

export default NativeNavigation;
