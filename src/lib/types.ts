import { Socket, Server as NetServer } from "net";
import { NextApiResponse } from "next";
import { Server as SocketIoServer } from "socket.io";
import { z } from "zod";

export const FormSchema = z.object({
	email: z
		.string()
		.describe("Email")
		.email({ message: "Invalid email address" }),
	password: z.string().describe("Password").min(1, "Password is required"),
});

export const CreateWorkspaceFormSchema = z.object({
	workspaceName: z
		.string()
		.describe("Workspace Name")
		.min(1, "Workspace Name is required"),
	logo: z.any(),
});

export const UploadBannerFormSchema = z.object({
	banner: z.string().describe("Banner Image"),
});

export type NextApiResponseServerIo = NextApiResponse & {
	socket: Socket & {
		server: NetServer & {
			io: SocketIoServer;
		};
	};
};
