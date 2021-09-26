import React from "react"
import { autobind } from "core-decorators"
import Chat from "@/pages/question/components/Chat"
import schema from "@/schemas/conversation/detail"
@autobind
class ConversationDetail extends Chat {
    constructor(props) {
        super(props)
        this.state = {
            ...this.state,
            showInput: false,
            roomHeight: this.props.roomHeight || "100vh",
        }
    }

    async componentDidMount() {
        let conversation_id =
            this.props.conversation_id ||
            this.props.location.query.conversation_id
        let list = []
        if (conversation_id) {
            let res = await schema.service.get({
                limit: 10000,
                conversation_id: conversation_id,
                order: "create_time",
            })
            res.list.map((item) => {
                if (item.type === "reply") {
                    list.push({
                        content: item.text,
                        onlyRead: true,
                        name: "智能客服",
                        time: new Date(),
                        avatar: "http://img.binlive.cn/6.png",
                        type: "left",
                    })
                }
                if (item.type === "receive") {
                    list.push({
                        content: item.text,
                        name: "我",
                        time: new Date(),
                        avatar: "http://img.binlive.cn/6.png",
                        type: "right",
                    })
                }
            })
            this.setState({
                messageList: list,
            })
        }
    }
}

export default ConversationDetail