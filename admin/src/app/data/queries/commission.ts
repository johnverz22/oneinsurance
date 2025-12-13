import { useAuthStore } from "@/store/auth-store";
import { CommissionConfigPaginatedResponse } from "@/types/commission";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export function useGetCommissionConfiguration(perPage: number = 15, page: number = 1) {
    const {accessToken} = useAuthStore();

    return useQuery({
        queryKey: ['commission-configuration', perPage, page],
        queryFn: async () => {
            const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/commission-configurations?per_page=${perPage}&page=${page}`;
            const token = `Bearer ${accessToken}`;
            const response = await axios.get<CommissionConfigPaginatedResponse>(url, {
                headers: {
                    Authorization: token
                }
            })

            return response.data;
        },
        enabled: !!accessToken,
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000,
    })
}