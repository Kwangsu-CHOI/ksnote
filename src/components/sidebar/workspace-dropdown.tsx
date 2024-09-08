"use client";

import { useAppState } from "@/lib/providers/state-provider";
import { workspace } from "@/lib/supabase/supabase.types";
import React, { useEffect, useState } from "react";
import SelectedWorkspace from "./selected-workspace";
import CustomDialogTrigger from "../global/custom-dialog-trigger";
import WorkspaceCreator from "../global/workspace-creator";

interface WorkspaceDropdownProps {
	privateWorkspaces: workspace[] | [];
	collaboratingWorkspaces: workspace[] | [];
	sharedWorkspaces: workspace[] | [];
	defaultValue: workspace | undefined;
}

const WorkspaceDropdown: React.FC<WorkspaceDropdownProps> = ({
	privateWorkspaces,
	collaboratingWorkspaces,
	sharedWorkspaces,
	defaultValue,
}) => {
	const { dispatch, state } = useAppState();
	const [selectedOption, setSelectedOption] = useState(defaultValue);
	const [isOpen, setIsOpen] = useState(false);

	useEffect(() => {
		if (!state.workspaces.length) {
			dispatch({
				type: "SET_WORKSPACES",
				payload: {
					workspaces: [
						...privateWorkspaces,
						...collaboratingWorkspaces,
						...sharedWorkspaces,
					].map((workspace) => ({ ...workspace, folders: [] })),
				},
			});
		}
	}, [privateWorkspaces, collaboratingWorkspaces, sharedWorkspaces]);

	const handleSelect = (option: workspace) => {
		setSelectedOption(option);
		setIsOpen(false);
	};

	useEffect(() => {
		const findSelectedWorkspace = state.workspaces.find(
			(workspace) => workspace.id === defaultValue?.id
		);
		if (findSelectedWorkspace) setSelectedOption(findSelectedWorkspace);
	}, [state, defaultValue]);

	return (
		<div className="relative inline-block text-left border-2 rounded-xl hover:border-foreground/50 mb-5">
			<div>
				<span onClick={() => setIsOpen(!isOpen)}>
					{selectedOption ? (
						<SelectedWorkspace workspace={selectedOption} />
					) : (
						"Select a workspace"
					)}
				</span>
			</div>
			{isOpen && (
				<div
					className="origin-top-right absolute w-full rounded-md shadow-md z-50 h-[250px] max-h-[350px]  bg-black/1 backdrop-blur-lg group overflow-scroll border-[1px] border-muted mt-2
    "
				>
					<div className="rounded-md flex flex-col w-full">
						<div className="!p-2">
							{!!privateWorkspaces.length && (
								<>
									<p className="text-muted-foreground mb-2">Private</p>
									<hr />
									{privateWorkspaces.map((option) => (
										<SelectedWorkspace
											key={option.id}
											workspace={option}
											onClick={handleSelect}
										/>
									))}
								</>
							)}
							{!!sharedWorkspaces.length && (
								<>
									<p className="text-muted-foreground mb-2">Shared</p>
									<hr />
									{sharedWorkspaces.map((option) => (
										<SelectedWorkspace
											key={option.id}
											workspace={option}
											onClick={handleSelect}
										/>
									))}
								</>
							)}
							{!!collaboratingWorkspaces.length && (
								<>
									<p className="text-muted-foreground">Collaborated</p>
									<hr />
									{collaboratingWorkspaces.map((option) => (
										<SelectedWorkspace
											key={option.id}
											workspace={option}
											onClick={handleSelect}
										/>
									))}
								</>
							)}
						</div>

						<CustomDialogTrigger
							header="Create a workspace"
							content={<WorkspaceCreator />}
							description="Create a new workspace to start organizing your notes. You can always add collaborators later."
						>
							<div className="flex transition-all hover:bg-muted justify-center items-center gap-2 p-2 h-full mb-2">
								<article className="text-slate-500 rounded-full bg-slate-800 w-4 h-4 flex items-center justify-center">
									+
								</article>{" "}
								Create Workspace
							</div>
						</CustomDialogTrigger>
					</div>
				</div>
			)}
		</div>
	);
};

export default WorkspaceDropdown;
