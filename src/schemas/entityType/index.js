import { createApi } from "@/components/ListPage/service"
import { schemaFieldType } from "@/outter/fr-schema/src/schema"

const schema = {
    domain_key: {
        title: "域",
        sorter: true,
        search: false,
        addHide: true,
        editHide: true,
        type: schemaFieldType.Select,
        props: {
            allowClear: true,
            showSearch: true,
        },
    },
    name: {
        title: "名称",
        searchPrefix: "like",
        sorter: true,
        required: true,
    },

    key: {
        title: "编码",
        searchPrefix: "like",
        sorter: true,
        required: true,
        extra: "域中的唯一编码,可用中文。初始化好了以后，请不要随意修改。",
    },
    regex: {
        title: "正则表达式",
        searchPrefix: "like",
        sorter: true,
        extra: "实体类型提取的统一正则表达式。",
    },
    create_time: {
        title: "创建时间",
        required: true,
        sorter: true,
        addHide: true,
        search: false,

        editHide: true,
        props: {
            // showTime: true,
            // valueType: "dateTime",
        },
        type: schemaFieldType.DatePicker,
    },
    remark: {
        title: "备注",
        search: false,
        type: schemaFieldType.TextArea,
        sorter: true,
    },
}

const service = createApi("entity_type", schema, null, "eq.")
service.upInsert = createApi(
    "entity_type?on_conflict=domain_key,key",
    schema,
    null,
    "eq."
).upInsert
export default {
    schema,
    service,
}
