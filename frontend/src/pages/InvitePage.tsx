import { useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api/axios'
import { useNavigate } from 'react-router-dom'


const InvitePage = () => {
    const { token } = useParams()
    const navigate = useNavigate()
    const hasAttemted = useRef(false) 


    useEffect(() => {
        if (hasAttemted.current) return;

        hasAttemted.current = true;
        verifyToken(token)

        return () => console.log("cleanup");
    }, [])


    const verifyToken = async (token: string | undefined) => {
        try {
            const res = await api.get(`/invites/${token}`)
            console.log(res)
            if (res.status === 200) {
                handleJoinGroup()
            }
        } catch (error : any) {
            console.error(error.response?.data?.detail || "An error occurred while verifying the invite token.")
            alert(error.response?.data?.detail || "An error occurred while verifying the invite token.")
        }
    }

    const handleJoinGroup = async () => {
        try {
            const res = await api.post(`/invites/register/${token}`)
            console.log(res.status)
            if (res.status == 200) {
                navigate('/dashboard', {
                    state: {
                        autoJoin: true,
                        inviteToken: token,
                        group_id: res.data.group_id
                    }
                })
            }
        } catch (error: any) {
            switch (error.response?.status) {
                case 401:
                    navigate(`/register?invite_token=${token}`)
                    break

                case 404:
                    console.error(error.response.data.detail)
                    break;

                default:
                    console.error(error.response?.data?.detail || "An error occurred")
                    break
            }
        }
    }

    return (
        <div>
            
        </div>
    )
}

export default InvitePage
