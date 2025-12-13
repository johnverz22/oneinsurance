import { useAuthStore } from "@/store/auth-store";
import { ApplicantPaginatedResponse } from "@/types/applicant";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

type useGetApplicantsProps = {
    page?: number;
    perPage?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    applicationType?: string;
    status?: string;
    search?: string;
}
export function useGetApplicants(props: useGetApplicantsProps) {
    const {accessToken} = useAuthStore();
    return useQuery({
        queryKey: ['applicants', props],
        queryFn: async () => {
            const params = new URLSearchParams();
            
            if (props.page) params.append('page', props.page.toString());
            if (props.perPage) params.append('per_page', props.perPage.toString());
            if (props.sortBy) params.append('sort_by', props.sortBy);
            if (props.sortOrder) params.append('sort_order', props.sortOrder);
            if (props.applicationType) params.append('application_type', props.applicationType);
            if (props.status) params.append('status', props.status);
            if (props.search) params.append('search', props.search);
            
            const queryString = params.toString();
            const url = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/applicants${queryString ? `?${queryString}` : ''}`;
            
            const response = await axios.get<ApplicantPaginatedResponse>(url, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                }
            })

            return response.data;
        },
        enabled: !!accessToken,
        refetchOnWindowFocus: false,
        staleTime: 3 * 60 * 1000,
    })
}