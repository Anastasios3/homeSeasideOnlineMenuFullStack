const TOKEN_KEY = "homeseaside_admin_token";

export const getAdminToken = (): string | null => sessionStorage.getItem(TOKEN_KEY);
export const setAdminToken = (token: string) => sessionStorage.setItem(TOKEN_KEY, token);
export const clearAdminToken = () => sessionStorage.removeItem(TOKEN_KEY);
