"use client";

import { useAppState } from "@/lib/providers/state-provider";
import { File, Folder, workspace } from "@/lib/supabase/supabase.types";
import React, {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import "quill/dist/quill.snow.css";
import { Button } from "../ui/button";
import {
	deleteFile,
	deleteFolder,
	findUser,
	getFileDetails,
	getFolderDetails,
	getWorkspaceDetails,
	updateFile,
	updateFolder,
	updateWorkspace,
} from "@/lib/supabase/queries";
import { usePathname, useRouter } from "next/navigation";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "../ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import Image from "next/image";
import EmojiPicker from "../global/emoji-picker";
import { XCircleIcon } from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import BannerUpload from "../banner-upload/banner-upload";
import { useSocket } from "@/lib/providers/socket-provider";
import { useSupabaseUser } from "@/lib/providers/supabase-user-provider";

interface QuillEditorProps {
	dirType: "workspace" | "folder" | "file";
	fileId: string;
	dirDetails: File | Folder | workspace;
}

var TOOLBAR_OPTIONS = [
	["bold", "italic", "underline", "strike"], // toggled buttons
	["blockquote", "code-block"],

	[{ header: 1 }, { header: 2 }], // custom button values
	[{ list: "ordered" }, { list: "bullet" }],
	[{ script: "sub" }, { script: "super" }], // superscript/subscript
	[{ indent: "-1" }, { indent: "+1" }], // outdent/indent
	[{ direction: "rtl" }], // text direction

	[{ size: ["small", false, "large", "huge"] }], // custom dropdown
	[{ header: [1, 2, 3, 4, 5, 6, false] }],

	[{ color: [] }, { background: [] }], // dropdown with defaults from theme
	[{ font: [] }],
	[{ align: [] }],

	["clean"], // remove formatting button
];

const QuillEditor: React.FC<QuillEditorProps> = ({
	dirType,
	fileId,
	dirDetails,
}) => {
	const supabase = createClientComponentClient();
	const { state, workspaceId, folderId, dispatch } = useAppState();
	const { socket, isConnected } = useSocket();
	const { user } = useSupabaseUser();
	const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();
	const router = useRouter();
	const pathname = usePathname();
	const [quill, setQuill] = useState<any>();
	const [collaborators, setCollaborators] = useState<
		{ id: string; email: string; avatarUrl: string }[]
	>([]);
	const [saving, setSaving] = useState(false);
	const [deletingBanner, setDeletingBanner] = useState(false);
	const [localCursor, setLocalCursor] = useState<any>([]);

	const quillRef = useRef<any>(null);
	const wrapperRef = useRef<HTMLDivElement | null>(null);

	const details = useMemo(() => {
		let selectedDir;
		if (dirType === "file") {
			selectedDir = state.workspaces
				.find((workspace) => workspace.id === workspaceId)
				?.folders.find((folder) => folder.id === folderId)
				?.files.find((file) => file.id === fileId);
		}
		if (dirType === "folder") {
			selectedDir = state.workspaces
				.find((workspace) => workspace.id === workspaceId)
				?.folders.find((folder) => folder.id === fileId);
		}
		if (dirType === "workspace") {
			selectedDir = state.workspaces.find(
				(workspace) => workspace.id === fileId
			);
		}

		if (selectedDir) {
			return selectedDir;
		}

		return {
			title: dirDetails.title,
			iconId: dirDetails.iconId,
			createdAt: dirDetails.createdAt,
			data: dirDetails.data,
			inTrash: dirDetails.inTrash,
			bannerUrl: dirDetails.bannerUrl,
		} as workspace | Folder | File;
	}, [state, workspaceId, folderId]);

	useEffect(() => {
		const initializeQuill = async () => {
			if (
				typeof window === "undefined" ||
				!wrapperRef.current ||
				quillRef.current
			)
				return;

			const wrapper = wrapperRef.current;
			wrapper.innerHTML = "";
			const editor = document.createElement("div");
			wrapper.append(editor);

			const Quill = (await import("quill")).default;
			const QuillCursors = (await import("quill-cursors")).default;
			Quill.register("modules/cursors", QuillCursors);

			quillRef.current = new Quill(editor, {
				theme: "snow",
				modules: {
					toolbar: TOOLBAR_OPTIONS,
					cursors: {
						transformOnTextChange: true,
					},
				},
			});
			if (quillRef.current) {
				setQuill(quillRef.current);
			}
		};

		initializeQuill();
	}, []);

	const restoreFileHandler = async () => {
		if (dirType === "file") {
			if (!folderId || !workspaceId) return;
			dispatch({
				type: "UPDATE_FILE",
				payload: {
					fileId,
					folderId,
					workspaceId,
					file: { inTrash: "" },
				},
			});
			await updateFile({ inTrash: "" }, fileId);
		}
		if (dirType === "folder") {
			if (!workspaceId) return;
			dispatch({
				type: "UPDATE_FOLDER",
				payload: { folderId: fileId, workspaceId, folder: { inTrash: "" } },
			});
			await updateFolder({ inTrash: "" }, fileId);
		}
	};

	const deleteFileHandler = async () => {
		if (dirType === "file") {
			if (!folderId || !workspaceId) return;
			dispatch({
				type: "DELETE_FILE",
				payload: {
					fileId,
					folderId,
					workspaceId,
				},
			});
			await deleteFile(fileId);
			router.replace(`/dashboard/${workspaceId}`);
		}
		if (dirType === "folder") {
			if (!workspaceId) return;
			dispatch({
				type: "DELETE_FOLDER",
				payload: { folderId: fileId, workspaceId },
			});
			await deleteFolder(fileId);
			router.replace(`/dashboard/${workspaceId}`);
		}
	};

	const breadCrumbs = useMemo(() => {
		if (!pathname || !state.workspaces || !workspaceId) return;
		const segments = pathname
			.split("/")
			.filter((val) => val !== "dashboard" && val);
		const workspaceDetails = state.workspaces.find(
			(workspace) => workspace.id === workspaceId
		);
		const workspaceBreadCrumb = workspaceDetails
			? `${workspaceDetails.iconId} ${workspaceDetails.title}`
			: "";
		if (segments.length === 1) {
			return workspaceBreadCrumb;
		}

		const folderSegment = segments[1];
		const folderDetails = workspaceDetails?.folders.find(
			(folder) => folder.id === folderSegment
		);
		const folderBreadCrumb = folderDetails
			? `/ ${folderDetails.iconId} ${folderDetails.title}`
			: "";

		if (segments.length === 2) {
			return `${workspaceBreadCrumb} ${folderBreadCrumb}`;
		}

		const fileSegment = segments[2];
		const fileDetails = folderDetails?.files.find(
			(file) => file.id === fileSegment
		);
		const fileBreadCrumb = fileDetails
			? `/ ${fileDetails.iconId} ${fileDetails.title}`
			: "";

		return `${workspaceBreadCrumb} ${folderBreadCrumb} ${fileBreadCrumb}`;
	}, [state, pathname, workspaceId]);

	const iconOnChange = async (icon: string) => {
		if (!fileId) return;

		if (dirType === "workspace") {
			dispatch({
				type: "UPDATE_WORKSPACE",
				payload: { workspaceId: fileId, workspace: { iconId: icon } },
			});
			await updateWorkspace({ iconId: icon }, fileId);
		}

		if (dirType === "folder") {
			if (!workspaceId) return;
			dispatch({
				type: "UPDATE_FOLDER",
				payload: { folderId: fileId, workspaceId, folder: { iconId: icon } },
			});
			await updateFolder({ iconId: icon }, fileId);
		}

		if (dirType === "file") {
			if (!folderId || !workspaceId) return;
			dispatch({
				type: "UPDATE_FILE",
				payload: { fileId, folderId, workspaceId, file: { iconId: icon } },
			});
			await updateFile({ iconId: icon }, fileId);
		}
	};

	const deleteBanner = async () => {
		if (!fileId) return;
		setDeletingBanner(true);
		if (dirType === "file") {
			if (!folderId || !workspaceId) return;
			dispatch({
				type: "UPDATE_FILE",
				payload: { fileId, folderId, workspaceId, file: { bannerUrl: "" } },
			});
			await supabase.storage.from("file-banners").remove([`banner-${fileId}`]);
			await updateFile({ bannerUrl: "" }, fileId);
		}

		if (dirType === "folder") {
			if (!workspaceId) return;
			dispatch({
				type: "UPDATE_FOLDER",
				payload: { folderId: fileId, workspaceId, folder: { bannerUrl: "" } },
			});
			await supabase.storage.from("file-banners").remove([`banner-${fileId}`]);
			await updateFolder({ bannerUrl: "" }, fileId);
		}

		if (dirType === "workspace") {
			dispatch({
				type: "UPDATE_WORKSPACE",
				payload: { workspaceId: fileId, workspace: { bannerUrl: "" } },
			});
			await supabase.storage.from("file-banners").remove([`banner-${fileId}`]);
			await updateWorkspace({ bannerUrl: "" }, fileId);
		}
		setDeletingBanner(false);
	};

	useEffect(() => {
		if (!fileId) return;
		let selectedDir;
		const fetchInformation = async () => {
			if (dirType === "file") {
				const { data: selectedDir, error } = await getFileDetails(fileId);
				if (error || !selectedDir) {
					return router.replace("/dashboard");
				}

				if (!selectedDir[0]) {
					if (!workspaceId) return;
					return router.replace(`/dashboard/${workspaceId}`);
				}
				if (!workspaceId || !quill) return;
				if (!selectedDir[0].data) return;
				quill.setContents(JSON.parse(selectedDir[0].data || ""));
				dispatch({
					type: "UPDATE_FILE",
					payload: {
						file: { data: selectedDir[0].data },
						fileId,
						folderId: selectedDir[0].folderId,
						workspaceId,
					},
				});
			}
			if (dirType === "folder") {
				const { data: selectedDir, error } = await getFolderDetails(fileId);
				if (error || !selectedDir) {
					return router.replace("/dashboard");
				}

				if (!selectedDir[0]) {
					router.replace(`/dashboard/${workspaceId}`);
				}
				if (!quill) return;
				if (!selectedDir[0].data) return;
				quill.setContents(JSON.parse(selectedDir[0].data || ""));
				dispatch({
					type: "UPDATE_FOLDER",
					payload: {
						folderId: fileId,
						folder: { data: selectedDir[0].data },
						workspaceId: selectedDir[0].workspaceId,
					},
				});
			}
			if (dirType === "workspace") {
				const { data: selectedDir, error } = await getWorkspaceDetails(fileId);
				if (error || !selectedDir) {
					return router.replace("/dashboard");
				}
				if (!selectedDir[0] || !quill) return;
				if (!selectedDir[0].data) return;
				quill.setContents(JSON.parse(selectedDir[0].data || ""));
				dispatch({
					type: "UPDATE_WORKSPACE",
					payload: {
						workspace: { data: selectedDir[0].data },
						workspaceId: fileId,
					},
				});
			}
		};
		fetchInformation();
	}, [fileId, workspaceId, quill, dirType, router, dispatch]);

	//rooms
	useEffect(() => {
		if (socket === null || quill === null || !fileId) return;
		socket.emit("create-room", fileId);
	}, [socket, quill, fileId]);

	//send quill changes to all clients
	useEffect(() => {
		if (socket === null || quill === null || !fileId || !user) return;

		const selectionChangeHandler = (cursorId: string) => {
			return (range: any, oldRange: any, source: any) => {
				if (source === "user" && cursorId) {
					socket.emit("send-cursor-move", range, fileId, cursorId);
				}
			};
		};

		const quillHandler = (delta: any, oldDelta: any, source: any) => {
			if (source !== "user") return;
			if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
			setSaving(true);

			const contents = quill.getContents();
			const quillLength = quill.getLength();
			saveTimerRef.current = setTimeout(async () => {
				if (contents && quillLength !== 1 && fileId) {
					if (dirType === "workspace") {
						dispatch({
							type: "UPDATE_WORKSPACE",
							payload: {
								workspaceId: fileId,
								workspace: { data: JSON.stringify(contents) },
							},
						});
						await updateWorkspace({ data: JSON.stringify(contents) }, fileId);
					}

					if (dirType === "folder") {
						if (!workspaceId) return;
						dispatch({
							type: "UPDATE_FOLDER",
							payload: {
								folderId: fileId,
								workspaceId,
								folder: { data: JSON.stringify(contents) },
							},
						});
						await updateFolder({ data: JSON.stringify(contents) }, fileId);
					}

					if (dirType === "file") {
						if (!folderId || !workspaceId) return;
						dispatch({
							type: "UPDATE_FILE",
							payload: {
								fileId,
								folderId,
								workspaceId,
								file: { data: JSON.stringify(contents) },
							},
						});
						await updateFile({ data: JSON.stringify(contents) }, fileId);
					}
				}
				setSaving(false);
			}, 850);
			socket.emit("send-changes", delta, fileId);
		};
		if (quill) {
			quill.on("text-change", quillHandler);
			quill.on("selection-change", selectionChangeHandler(user.id));
		}

		return () => {
			if (quill) {
				quill.off("text-change", quillHandler);
				quill.off("selection-change", selectionChangeHandler);
			}

			if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
		};
	}, [socket, quill, fileId, user, details]);

	//listen for changes from other clients
	useEffect(() => {
		if (socket === null || quill === null || !fileId || !localCursor.length)
			return;

		const socketHandler = (range: any, roomId: string, cursorId: string) => {
			if (roomId === fileId) {
				const cursorToMove = localCursor.find(
					(c: any) => c.cursors()?.[0].id === cursorId
				);
				if (cursorToMove) {
					cursorToMove.moveCursor(cursorId, range);
				}
			}
		};
		socket.on("receive-cursor-move", socketHandler);

		return () => {
			socket.off("receive-cursor-move", socketHandler);
		};
	}, [socket, quill, fileId, localCursor]);

	useEffect(() => {
		if (socket === null || quill === null) return;
		const socketHandler = (delta: any, id: string) => {
			if (id === fileId) {
				quill.updateContents(delta);
			}
		};
		socket.on("receive-changes", socketHandler);

		return () => {
			socket.off("receive-changes", socketHandler);
		};
	}, [quill, socket, fileId]);

	//socket connection check
	useEffect(() => {
		if (socket === null) {
			console.log("socket is not initialized.");
			return;
		}

		if (!fileId) {
			console.log("fileId is not defined.");
			return;
		}

		console.log("socket connection attempt...");
		socket.emit("create-room", fileId);

		socket.on("connect", () => {
			console.log("socket connected.");
		});

		socket.on("connect_error", (error: any) => {
			console.error("socket connection error:", error);
		});

		return () => {
			socket.off("connect");
			socket.off("connect_error");
		};
	}, [socket, fileId]);

	//show users on collaboration note page
	useEffect(() => {
		if (!fileId || quill === null) return;
		const room = supabase.channel(fileId);
		const subscription = room
			.on("presence", { event: "sync" }, () => {
				const newState = room.presenceState();
				const newCollaborators = Object.values(newState).flat() as any;
				setCollaborators(newCollaborators);

				if (user) {
					const allCursors: any = [];
					newCollaborators.forEach(
						(collaborators: {
							id: string;
							email: string;
							avatarUrl: string;
						}) => {
							if (collaborators.id !== user.id) {
								const userCursor = quill.getModule("cursors");
								userCursor.createCursor(
									collaborators.id,
									collaborators.email.split("@")[0],
									`#${Math.random().toString(16).slice(2, 8)}`
								);
								allCursors.push(userCursor);
							}
						}
					);
					setLocalCursor(allCursors);
				}
			})
			.subscribe(async (status) => {
				if (status !== "SUBSCRIBED" || !user) return;
				const response = await findUser(user.id);
				if (!response) return;
				room.track({
					id: user.id,
					email: user.email?.split("@")[0],
					avatarUrl: response.avatarUrl
						? supabase.storage.from("avatars").getPublicUrl(response.avatarUrl)
								.data.publicUrl
						: "",
				});
			});
		return () => {
			supabase.removeChannel(room);
		};
	}, [fileId, quill, supabase, user]);

	return (
		<>
			<div className="relative">
				{details.inTrash && (
					<article className="py-2 z-40 bg-[#EB5757] flex  md:flex-row flex-col justify-center items-center gap-4 flex-wrap">
						<div className="flex flex-col md:flex-row gap-2 justify-center items-center">
							<span className="text-white">
								This {dirType} is in the trash.
							</span>
							<Button
								size="sm"
								variant="outline"
								className="bg-transparent border-white text-white hover:bg-white hover:text-[#EB5757]"
								onClick={restoreFileHandler}
							>
								Restore
							</Button>

							<Button
								size="sm"
								variant="outline"
								className="bg-transparent border-white text-white hover:bg-white hover:text-[#EB5757]"
								onClick={deleteFileHandler}
							>
								Delete
							</Button>
						</div>
						<span className="text-sm text-white">{details.inTrash}</span>
					</article>
				)}
				<div className="flex flex-col-reverse sm:flex-row sm:justify-between justify-center sm:items-center sm:p-2 p-8">
					<div>{breadCrumbs}</div>
					<div className="flex items-center gap-4">
						<div className="flex items-center justify-center h-10">
							{collaborators?.map((collaborator) => (
								<TooltipProvider key={collaborator.id}>
									<Tooltip>
										<TooltipTrigger asChild>
											<Avatar className="-ml-3 bg-background border-2 flex items-center justify-center border-white h-8 w-8 rounded-full">
												<AvatarImage
													src={
														collaborator.avatarUrl ? collaborator.avatarUrl : ""
													}
													className="rounded-full"
												/>
												<AvatarFallback>
													{collaborator.email.substring(0, 2).toUpperCase()}
												</AvatarFallback>
											</Avatar>
										</TooltipTrigger>
										<TooltipContent>{collaborator.email}</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							))}
						</div>
						{saving ? (
							<Badge
								variant="secondary"
								className="bg-orange-600 top-4 text-white right-4 z-50"
							>
								Saving...
							</Badge>
						) : (
							<Badge
								variant="secondary"
								className="bg-emerald-600 top-4 text-white right-4 z-50"
							>
								Saved
							</Badge>
						)}
					</div>
				</div>
			</div>
			{details.bannerUrl && (
				<div className="relative w-full h-[200px]">
					<Image
						src={
							supabase.storage
								.from("file-banners")
								.getPublicUrl(details.bannerUrl).data.publicUrl
						}
						fill
						className="w-full md:h-48
            h-20
            object-cover"
						alt="Banner Image"
					/>
				</div>
			)}
			<div className="flex justify-center items-center flex-col mt-2 relative">
				<div className="w-full self-center max-w-[800px] flex flex-col px-7 lg:my-8">
					<div className="text-[80px]">
						<EmojiPicker getValue={iconOnChange}>
							<div className="w-[100px] cursor-pointer transition-colors h-[100px] flex items-center justify-center hover:bg-muted rounded-xl">
								{details.iconId}
							</div>
						</EmojiPicker>
					</div>
					<div className="flex ">
						<BannerUpload
							id={fileId}
							dirType={dirType}
							className="mt-2 text-sm text-muted-foreground p-2 hover:text-card-foreground transition-all rounded-md"
						>
							{details.bannerUrl ? "Update Banner" : "Add Banner"}
						</BannerUpload>
						{details.bannerUrl && (
							<Button
								disabled={deletingBanner}
								onClick={deleteBanner}
								variant="ghost"
								className="gap-2 hover:bg-background flex items-center justify-center mt-2 text-sm text-muted-foreground w-36 p-2 rounded-md"
							>
								<XCircleIcon size={16} />
								<span className="whitespace-nowrap font-normal">
									Remove Banner
								</span>
							</Button>
						)}
					</div>
					<div className="flex items-baseline justify-between">
						<span className="text-muted-foreground text-3xl font-bold h-9">
							{details.title}
						</span>
						<span className="text-muted-foreground text-sm border-2 border-muted rounded-md p-2">
							{dirType.toUpperCase()}
						</span>
					</div>
				</div>
				<div
					id="container"
					className="max-w-[80%] w-[80%] h-screen md:border-2 md:p-2"
					ref={wrapperRef}
				></div>
			</div>
		</>
	);
};

export default QuillEditor;
