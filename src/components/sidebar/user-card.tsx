import React from "react";
import { Subscription } from "@/lib/supabase/supabase.types";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import db from "@/lib/supabase/db";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

import { LogOut } from "lucide-react";
import LogoutButton from "../global/logout-button";
import ProfileIcon from "../icons/ProfileIcon";
import { ModeToggle } from "../global/mode-toggle";
import { Separator } from "../ui/separator";

const UserCard = async () => {
	const supabase = createServerComponentClient({ cookies });
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) return;
	const response = await db.query.users.findFirst({
		where: (u, { eq }) => eq(u.id, user.id),
	});
	let avatarPath;
	if (!response) return;
	if (!response.avatarUrl) avatarPath = "";
	else {
		avatarPath = supabase.storage
			.from("ksnote-avatars")
			.getPublicUrl(response.avatarUrl)?.data.publicUrl;
	}
	const profile = {
		...response,
		avatarUrl: avatarPath,
	};

	return (
		<article className="hidden sm:flex justify-between gap-2 items-center px-4 py-2 flex-col">
			<Separator />
			<div className="flex justify-between items-center w-full mt-2">
				<aside className="flex justify-center items-center gap-2">
					<Avatar>
						<AvatarImage src={profile.avatarUrl} />
						<AvatarFallback>
							<ProfileIcon />
						</AvatarFallback>
					</Avatar>
					<div className="flex">
						<small className="w-[100px] overflow-hidden overflow-ellipsis">
							{profile.email}
						</small>
					</div>
				</aside>

				<div className="flex items-center justify-center gap-2">
					<LogoutButton>
						<LogOut />
					</LogoutButton>
					<ModeToggle />
				</div>
			</div>
		</article>
	);
};

export default UserCard;
