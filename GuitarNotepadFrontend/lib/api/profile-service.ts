import { User } from "@/types/profile";
import { apiClient } from "./client";

export class ProfileService {
    static async getFullInfo(id?: String): Promise<User>{
        const response = await apiClient.get<User>("/User/profile");
        console.log(response);
        return response;
    }
    static async updateProfile(data: Partial<User>): Promise<User> {
        const response = await apiClient.put<User>("/User/profile", data);
        return response;
    }
}