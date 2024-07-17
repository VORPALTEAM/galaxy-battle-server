
export type TGInitData = {
    query_id: string,
    auth_date: number,
    hash: string,
    user: {
        id: number,
        first_name: string,
        last_name?: string,
        username?: string,
        language_code: string,
        is_premium: boolean,
        allows_write_to_pm: boolean
    }
}

