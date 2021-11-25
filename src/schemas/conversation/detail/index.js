import { createApi } from "@/outter/fr-schema/src/service"
import { schemaFieldType } from "@/outter/fr-schema/src/schema"
import { Tooltip } from "antd"
var issafariBrowser =
    /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)
const schema = {
    id: {
        title: "编号",
        listHide: true,
    },
    node_key: {
        title: "节点",
        type: schemaFieldType.Select,
        width: issafariBrowser ? "50px" : undefined,
    },
    type: {
        title: "类型",
        type: schemaFieldType.Select,
        width: issafariBrowser ? "50px" : undefined,
        dict: {
            receive: {
                value: "receive",
                remark: "接收",
            },
            reply: {
                value: "reply",
                remark: "回复",
            },
            action: {
                value: "action",
                remark: "操作",
            },
        },
        render: (item) => {
            return <div style={{ minWidth: "30px" }}>{item}</div>
        },
    },
    intent_history_id: {
        title: "意图",
        type: schemaFieldType.Select,
        width: issafariBrowser ? "50px" : undefined,
    },
    text: {
        title: "文本",
        // width: 350,
    },
    action_key: {
        title: "操作",
        type: schemaFieldType.Select,
        render: (item) => {
            return <div style={{ minWidth: "50px" }}>{item}</div>
        },
    },
    slot: {
        title: "槽位",
        // width: 350,
        render: (item, record) => (
            <Tooltip title={JSON.stringify(item)}>
                <div
                    style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        minWidth: "100px",
                        maxWidth: "100px",
                    }}
                >
                    {JSON.stringify(item)}
                </div>
            </Tooltip>
        ),
    },
    result_text: {
        title: "行为结果",
        // width: 350,
        render: (item, record) => {
            let text =
                record.result && record.result.text && record.type === "action"
                    ? record.result.text
                    : ""
            return (
                <Tooltip title={text}>
                    <div
                        style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            minWidth: "100px",
                            maxWidth: "100px",
                        }}
                    >
                        {text}
                    </div>
                </Tooltip>
            )
        },
    },
}

const service = createApi("conversation_detail", schema, null, "eq.")

service.getDetail = (args) => {
    return createApi("conversation_detail", schema, null, "eq.").get({
        ...args,
        select: "*,intent_history(*)",
    })
}

export default {
    schema,
    service,
}
