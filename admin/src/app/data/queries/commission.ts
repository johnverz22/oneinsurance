import { useAuthStore } from "@/store/auth-store";
import { CommissionConfigPaginatedResponse } from "@/types/commission";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { handleApiError } from "@/utils/handle-api-error";

export function useGetCommissionConfiguration(perPage: number = 15, page: number = 1) {
    const {accessToken} = useAuthStore();

    return useQuery({
        queryKey: ['commission-configuration', perPage, page],
        queryFn: async () => {
            try {
                const searchParams = new URLSearchParams()
                searchParams.append('per_page', perPage.toString())
                searchParams.append('page', page.toString())

                const response = await axios.get<CommissionConfigPaginatedResponse>(
                    `/api/admin/commission-configurations?${searchParams.toString()}`,
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    }
                )

                return response.data;
            } catch (error) {
                handleApiError(error)
            }
        },
        enabled: !!accessToken,
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000,
    })
}