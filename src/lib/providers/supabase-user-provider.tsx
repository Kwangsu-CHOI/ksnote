"use client";

import { AuthUser } from "@supabase/supabase-js";
import { Subscription } from "../supabase/supabase.types";
import { createContext, useContext, useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useToast } from "@/components/ui/use-toast";

type SupabaseUserContextType = {
	user: AuthUser | null;
};

const SupabaseUserContext = createContext<SupabaseUserContextType>({
	user: null,
});

export const useSupabaseUser = () => {
	return useContext(SupabaseUserContext);
};

interface SupabaseUserProviderProps {
	children: React.ReactNode;
}

export const SupabaseUserProvider: React.FC<SupabaseUserProviderProps> = ({
	children,
}) => {
	const supabase = createClientComponentClient();
	const [user, setUser] = useState<AuthUser | null>(null);
	const { toast } = useToast();
	//fetch user details

	useEffect(() => {
		const getUser = async () => {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (user) {
				console.log(user);
				setUser(user);
			}
		};
		getUser();
	}, [supabase, toast]);

	return (
		<SupabaseUserContext.Provider value={{ user }}>
			{children}
		</SupabaseUserContext.Provider>
	);
};
