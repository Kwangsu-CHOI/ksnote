"use client";

import React, { useEffect, useRef, useState } from "react";
import { useToast } from "../ui/use-toast";
import { useAppState } from "@/lib/providers/state-provider";
import { User, workspace } from "@/lib/supabase/supabase.types";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import {
	Briefcase,
	Lock,
	LogOut,
	Plus,
	Share,
	User as UserIcon,
} from "lucide-react";
import { Separator } from "../ui/separator";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import {
	addCollaborators,
	deleteWorkspace,
	getCollaborators,
	removeCollaborators,
	updateUser,
	updateWorkspace,
} from "@/lib/supabase/queries";
import { v4 } from "uuid";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";
import CollaboratorSearch from "../global/collaborator-search";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Alert, AlertDescription } from "../ui/alert";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "../ui/alert-dialog";
import ProfileIcon from "../icons/ProfileIcon";
import { useSupabaseUser } from "@/lib/providers/supabase-user-provider";
import LogoutButton from "../global/logout-button";
import { ModeToggle } from "../global/mode-toggle";

const SettingsForm = () => {
	const { toast } = useToast();
	const router = useRouter();
	const supabase = createClientComponentClient();
	const { state, workspaceId, dispatch } = useAppState();
	const { user } = useSupabaseUser();

	const [permissions, setPermissions] = useState("private");
	const [collaborators, setCollaborators] = useState<User[] | []>([]);
	const [openAlertMessage, setOpenAlertMessage] = useState(false);
	const [workspaceDetails, setWorkspaceDetails] = useState<workspace>();
	const [uploadingProfilePic, setUploadingProfilePic] = useState(false);
	const [uploadingLogo, setUploadingLogo] = useState(false);
	const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);

	const titleTimerRef = useRef<ReturnType<typeof setTimeout>>();

	//add collaborators function
	const addCollaborator = async (profile: User) => {
		if (!workspaceId) return;

		await addCollaborators([profile], workspaceId);
		setCollaborators([...collaborators, profile]);
	};

	//remove collaborators function
	const removeCollaborator = async (user: User) => {
		if (!workspaceId) return;
		if (collaborators.length === 1) {
			setPermissions("private");
		}
		await removeCollaborators([user], workspaceId);
		setCollaborators(
			collaborators.filter((collaborator) => collaborator.id !== user.id)
		);
		router.refresh();
	};

	//onchanges
	const workspaceNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (!workspaceId || !e.target.value) return;
		dispatch({
			type: "UPDATE_WORKSPACE",
			payload: {
				workspaceId,
				workspace: {
					title: e.target.value,
				},
			},
		});
		if (titleTimerRef.current) clearTimeout(titleTimerRef.current);
		titleTimerRef.current = setTimeout(async () => {
			await updateWorkspace({ title: e.target.value }, workspaceId);
		}, 500);
	};

	const onChangeWorkspaceLogo = async (
		e: React.ChangeEvent<HTMLInputElement>
	) => {
		if (!workspaceId) return;
		const file = e.target.files?.[0];
		if (!file) return;
		const uuid = v4();
		const { data, error } = await supabase.storage
			.from("ksnote-logo")
			.upload(`workspaceLogo.${uuid}`, file, {
				cacheControl: "3600",
				upsert: true,
			});
		if (!error) {
			dispatch({
				type: "UPDATE_WORKSPACE",
				payload: {
					workspaceId,
					workspace: {
						logo: data.path,
					},
				},
			});
			await updateWorkspace({ logo: data.path }, workspaceId);
			setUploadingLogo(false);
		}
	};

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			setSelectedFile(file);
		}
	};

	const handleUpload = async () => {
		if (!selectedFile) {
			toast({
				title: "오류",
				description: "파일을 선택해주세요.",
				variant: "destructive",
			});
			return;
		}

		let filePath = "";

		const uploadAvatar = async () => {
			const fileExt = selectedFile.name.split(".").pop();
			const fileName = `avatar-${v4()}.${fileExt}`;
			const { data, error } = await supabase.storage
				.from("ksnote-avatars")
				.upload(fileName, selectedFile, { cacheControl: "3600", upsert: true });

			if (error) throw error;
			filePath = data.path;
		};

		const deleteAvatar = async (avatarUrl: string) => {
			const { error } = await supabase.storage
				.from("ksnote-avatars")
				.remove([avatarUrl]);
			if (error) throw error;
		};

		try {
			if (!user) {
				toast({
					title: "Error",
					description: "User information not found.",
					variant: "destructive",
				});
				return;
			}

			// 현재 사용자의 아바타 URL 가져오기
			const { data: userData, error: userError } = await supabase
				.from("users")
				.select("avatar_url")
				.eq("id", user.id)
				.single();

			if (userError) throw userError;

			// 이전 아바타 삭제
			if (userData?.avatar_url) {
				await deleteAvatar(userData.avatar_url);
			}

			// 새 아바타 업로드
			await uploadAvatar();

			// 사용자 정보 업데이트
			const result = await updateUser({ avatarUrl: filePath }, user.id);
			if (result?.error) {
				throw new Error(result.error);
			}

			setAvatarUrl(filePath);

			// 아바타 URL 새로고침
			const { data: newAvatarData, error: newAvatarError } = await supabase
				.from("users")
				.select("avatar_url")
				.eq("id", user.id)
				.single();

			if (newAvatarError) throw newAvatarError;

			if (newAvatarData && newAvatarData.avatar_url) {
				const { data: publicUrlData } = supabase.storage
					.from("ksnote-avatars")
					.getPublicUrl(newAvatarData.avatar_url);

				const newAvatarUrlWithTimestamp = `${
					publicUrlData.publicUrl
				}?t=${new Date().getTime()}`;
				setAvatarUrl(newAvatarUrlWithTimestamp);
			}

			toast({
				title: "Success",
				description: "Profile picture updated successfully.",
			});

			// 선택된 파일 초기화
			setSelectedFile(null);
		} catch (error) {
			console.error("Error uploading profile picture:", error);
			toast({
				title: "Error",
				description: "Failed to update profile picture.",
				variant: "destructive",
			});
		}
	};

	//onclicks
	const onClickAlertConfirm = async () => {
		if (!workspaceId) return;
		if (collaborators.length > 0) {
			await removeCollaborators(collaborators, workspaceId);
		}
		setPermissions("private");
		setOpenAlertMessage(false);
	};

	const onPermissionsChange = (val: string) => {
		if (val === "private") {
			setOpenAlertMessage(true);
		} else setPermissions(val);
	};

	//fetching avatar details
	useEffect(() => {
		const fetchAvatarUrl = async () => {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (user) {
				const { data, error } = await supabase
					.from("users")
					.select("avatar_url")
					.eq("id", user.id)
					.single();

				if (error) {
					console.error("error retrieving avatar url:", error);
				} else if (data && data.avatar_url) {
					// 공개 URL 생성
					const { data: publicUrlData } = supabase.storage
						.from("ksnote-avatars")
						.getPublicUrl(data.avatar_url);

					// 캐시 방지를 위한 타임스탬프 추가
					const avatarUrlWithTimestamp = `${
						publicUrlData.publicUrl
					}?t=${new Date().getTime()}`;
					setAvatarUrl(avatarUrlWithTimestamp);
				}
			}
		};

		fetchAvatarUrl();
	}, [supabase]);

	//fetching workspace details
	useEffect(() => {
		const showingWorkspace = state.workspaces.find(
			(workspace) => workspace.id === workspaceId
		);
		if (showingWorkspace) setWorkspaceDetails(showingWorkspace);
	}, [state, workspaceId]);

	//get all the collaborators
	useEffect(() => {
		if (!workspaceId) return;
		const fetchCollaborators = async () => {
			const response = await getCollaborators(workspaceId);
			if (response.length) {
				setPermissions("shared");
				setCollaborators(response);
			}
		};
		fetchCollaborators();
	}, [workspaceId]);

	return (
		<div className="flex gap-4 flex-col">
			<p className="flex items-center gap-2 mt-6">
				<Briefcase size={20} />
				Workspace
			</p>
			<Separator />
			<div className="flex flex-col gap-2">
				<Label
					htmlFor="workspaceName"
					className="text-sm text-muted-foreground"
				>
					Name
				</Label>
				<Input
					name="workspaceName"
					value={workspaceDetails ? workspaceDetails.title : ""}
					placeholder="Workspace Name"
					onChange={workspaceNameChange}
				/>
				<Label
					htmlFor="workspaceLogo"
					className="text-sm text-muted-foreground"
				>
					Workspace Logo
				</Label>
				<Input
					name="workspaceLogo"
					type="file"
					accept="image/*"
					placeholder="Workspace Logo"
					onChange={onChangeWorkspaceLogo}
					disabled={uploadingLogo}
				/>
			</div>
			<>
				<Label htmlFor="Permissions" className="text-sm text-muted-foreground">
					Permissions
				</Label>
				<Select onValueChange={onPermissionsChange} value={permissions}>
					<SelectTrigger className="w-full h-26 -mt-3">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							<SelectItem value="private">
								<div
									className="p-2
                  flex
                  gap-4
                  justify-center
                  items-center
                "
								>
									<Lock />
									<article className="text-left flex flex-col">
										<span>Private</span>
										<p>Only you can access this workspace.</p>
									</article>
								</div>
							</SelectItem>
							<SelectItem value="shared">
								<div className="p-2 flex gap-4 justify-center items-center">
									<Share />
									<article className="text-left flex flex-col">
										<span>Shared</span>
										<span>You can invite collaborators.</span>
									</article>
								</div>
							</SelectItem>
						</SelectGroup>
					</SelectContent>
				</Select>

				{permissions === "shared" && (
					<div>
						<CollaboratorSearch
							existingCollaborators={collaborators}
							getCollaborator={(user) => {
								addCollaborator(user);
							}}
						>
							<Button type="button" className="text-sm mt-4">
								<Plus />
								Add Collaborators
							</Button>
						</CollaboratorSearch>
						<div className="mt-4">
							<span className="text-sm text-muted-foreground">
								Collaborators {collaborators.length || ""}
							</span>
							<ScrollArea
								className="
            h-[120px]
            overflow-y-scroll
            w-full
            rounded-md
            border
            border-muted-foreground/20"
							>
								{collaborators.length ? (
									collaborators.map((c) => (
										<div
											className="p-4 flex
                      justify-between
                      items-center
                "
											key={c.id}
										>
											<div className="flex gap-4 items-center">
												<Avatar>
													<AvatarImage src="/avatars/7.png" />
													<AvatarFallback>KS</AvatarFallback>
												</Avatar>
												<div
													className="text-sm 
                          gap-2
                          text-muted-foreground
                          overflow-hidden
                          overflow-ellipsis
                          sm:w-[300px]
                          w-[140px]
                        "
												>
													{c.email}
												</div>
											</div>
											<Button
												variant="secondary"
												onClick={() => removeCollaborator(c)}
											>
												Remove
											</Button>
										</div>
									))
								) : (
									<div
										className="absolute
                  right-0 left-0
                  top-0
                  bottom-0
                  flex
                  justify-center
                  items-center
                "
									>
										<span className="text-muted-foreground text-sm">
											You have no collaborators
										</span>
									</div>
								)}
							</ScrollArea>
						</div>
					</div>
				)}
				<Alert variant={"destructive"}>
					<AlertDescription>
						Warning! You are about to delete this workspace. All data will be
						permanently deleted. This action cannot be undone.
					</AlertDescription>
					<Button
						type="submit"
						size="sm"
						variant="destructive"
						className="mt-4 text-sm bg-destructive/40 border-2 border-destructive"
						onClick={async () => {
							if (workspaceId) {
								await deleteWorkspace(workspaceId);
								toast({ title: "Workspace deleted successfully 👍" });
								dispatch({ type: "DELETE_WORKSPACE", payload: workspaceId });
								router.replace("/dashboard");
							}
						}}
					>
						Delete Workspace
					</Button>
				</Alert>
				<p className="flex items-center gap-2 mt-6">
					<UserIcon size={20} /> Profile
				</p>
				<Separator />
				<div className="flex items-center">
					<Avatar>
						<AvatarImage src={avatarUrl || ""} />
						<AvatarFallback>
							<ProfileIcon />
						</AvatarFallback>
					</Avatar>
					<div className="flex flex-col ml-6">
						<small className="text-muted-foreground cursor-not-allowed">
							{user ? user.email : ""}
						</small>
						<Label
							htmlFor="profilePicture"
							className="text-sm text-muted-foreground"
						>
							Profile Picture
						</Label>
						<Input
							id="profilePicture"
							type="file"
							accept="image/*"
							onChange={handleFileSelect}
						/>
						<Button
							variant="outline"
							onClick={handleUpload}
							disabled={!selectedFile}
							className="mt-2"
						>
							Change Profile Picture
						</Button>
					</div>
				</div>
				<Separator />
				<div className="flex items-center justify-between">
					<LogoutButton>
						<div className="flex items-center">
							<LogOut />
						</div>
					</LogoutButton>
					<ModeToggle />
				</div>
			</>
			<AlertDialog open={openAlertMessage}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
						<AlertDialogDescription>
							Changing your workspace to Private will remove all collaborators
							and the workspace will be inaccessible to others. This action
							cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => setOpenAlertMessage(false)}>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction onClick={onClickAlertConfirm}>
							Continue
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
};

export default SettingsForm;
