import { createApi } from "@/outter/fr-schema/src/service"
import { schemaFieldType } from "@/outter/fr-schema/src/schema"

const schema = {
    id: {
        title: "编号",
        sorter: true,
        infoHide: true,
    },
    name: {
        title: "名称",
        searchPrefix: "like",
        sorter: true,
        required: true,
    },
    key: {
        title: "主键",
        searchPrefix: "like",
        sorter: true,
        required: true,
    },

    regex: {
        title: "正则表达式",
        searchPrefix: "like",
        sorter: true,
        required: true,
    },
    domain_key: {
        title: "域",
        sorter: true,
        type: schemaFieldType.Select,
    },
    create_time: {
        title: "创建时间",
        required: true,
        sorter: true,
        addHide: true,
        editHide: true,
        props: {
            showTime: true,
        },
        type: schemaFieldType.DatePicker,
    },
    remark: {
        title: "备注",
        type: schemaFieldType.TextArea,
        sorter: true,
    },
}

const service = createApi("entity_type", schema, null, "eq.")

export default {
    schema,
    service,
}
