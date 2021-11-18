import { connect } from "dva"
import DataList from "@/outter/fr-schema-antd-utils/src/components/Page/DataList"
import schemas from "@/schemas"
import React from "react"
import { Select, Button, message } from "antd"
import { Form } from "@ant-design/compatible"
import "@ant-design/compatible/assets/index.css"
import frSchema from "@/outter/fr-schema/src"

import { exportData } from "@/outter/fr-schema-antd-utils/src/utils/xlsx"
import { schemaFieldType } from "@/outter/fr-schema/src/schema"
import ImportModal from "@/outter/fr-schema-antd-utils/src/components/modal/ImportModal"

const { decorateList } = frSchema
const { utils } = frSchema
@connect(({ global }) => ({
    dict: global.dict,
}))
@Form.create()
class List extends DataList {
    constructor(props) {
        const importTemplateUrl = (BASE_PATH + "/import/实体.xlsx").replace(
            "//",
            "/"
        )
        super(props, {
            schema: schemas.entity.schema,
            service: schemas.entity.service,
            infoProps: {
                width: "900px",
            },
            operateWidth: "120px",
            importTemplateUrl,
        })
    }

    async componentDidMount() {
        const res = await schemas.entityType.service.get({ pageSize: 10000 })
        let typeList = utils.dict.listToDict(res.list, null, "key", "name")
        this.schema.domain_key.dict = this.props.dict.domain
        this.schema.type_key.props = {}
        this.schema.type_key.props.typeKeyArry = res.list
        this.schema.type_key.renderInput = (
            item,
            tempData,
            props,
            action,
            form
        ) => {
            let options = []
            this.infoForm = props.form
            if (
                props.form &&
                props.form.current &&
                props.form.current.getFieldsValue().domain_key
            ) {
                options = props.typeKeyArry
                    .filter(
                        (item) =>
                            item.domain_key ===
                            props.form.current.getFieldsValue().domain_key
                    )
                    .map((item, index) => {
                        return { value: item.key, label: item.name }
                    })
            } else {
                options = props.typeKeyArry
                    .filter((item) => {
                        if (tempData && tempData.domain_key)
                            return item.domain_key === tempData.domain_key
                        else {
                            return true
                        }
                    })
                    .map((item, index) => {
                        return { value: item.key, label: item.name }
                    })
            }
            return <Select {...props} options={options} allowClear></Select>
        }
        this.schema.type_key.dict = typeList
        super.componentDidMount()
    }

    renderInfoModal() {
        let onValuesChange = (data, item) => {
            if (data.domain_key) {
                this.infoForm.current.setFieldsValue({ type_key: null })
            }
        }
        return super.renderInfoModal({ onValuesChange })
    }

    /**
     * 操作栏按钮
     */
    renderOperationButtons() {
        if (this.props.renderOperationButtons) {
            return this.props.renderOperationButtons()
        }

        return (
            <>
                {!this.props.readOnly && !this.meta.addHide && (
                    <Button
                        type="primary"
                        onClick={() =>
                            this.handleVisibleModal(true, null, "add")
                        }
                    >
                        新增
                    </Button>
                )}
                <Button
                    onClick={() => {
                        this.setState({ visibleImport: true })
                    }}
                >
                    导入
                </Button>

                <Button
                    loading={this.state.exportLoading}
                    onClick={() => {
                        // this.setState({ visibleExport: true })
                        console.log("data")
                        this.handleExport()
                    }}
                >
                    导出
                </Button>
            </>
        )
    }

    handleVisibleImportModal = (flag, record, action) => {
        this.setState({
            visibleImport: !!flag,
            infoData: record,
            action,
        })
    }

    async handleExport(args, schema) {
        this.setState({ exportLoading: true }, async () => {
            let column = this.getColumns(false).filter((item) => {
                return !item.isExpand && item.key !== "external_id"
            })
            let columns = [
                {
                    title: "域",
                    dataIndex: "domain_key",
                    key: "domain_key",
                },
                {
                    title: "名称",
                    dataIndex: "name",
                    key: "name",
                },
                {
                    title: "类型",
                    dataIndex: "type_key",
                    key: "type_key",
                },
                {
                    title: "备注",
                    dataIndex: "remark",
                    key: "remark",
                },
                {
                    title: "属性",
                    dataIndex: "attribute",
                    key: "attribute",
                },
            ]
            let data = await this.requestList({
                pageSize: 1000000,
                offset: 0,
                ...args,
            })
            let list = data.list
            list = list.map((item) => {
                return {
                    ...item,
                    attribute: item.attribute
                        ? JSON.stringify(item.attribute)
                        : "",
                }
            })
            data = decorateList(list, this.schema)
            await exportData("实体", data, columns)
            this.setState({ exportLoading: false })
        })
    }

    renderImportModal() {
        return (
            <ImportModal
                importTemplateUrl={this.meta.importTemplateUrl}
                schema={{
                    domain_key: {
                        title: "域",
                        required: true,
                    },
                    name: {
                        title: "名称",
                        rules: (rule, value) => value,
                        required: true,
                    },
                    type_key: {
                        title: "类型",
                        rules: (rule, value) => value,
                        required: true,
                    },
                    remark: {
                        title: "备注",
                    },
                    attribute: {
                        title: "属性",
                    },
                }}
                errorKey={"question_standard"}
                title={"导入"}
                sliceNum={1}
                onCancel={() => this.setState({ visibleImport: false })}
                onChange={(data) => this.setState({ importData: data })}
                onOk={async () => {
                    // to convert
                    let attributeAttr = []
                    const data = this.state.importData.map((item) => {
                        let attribute = null
                        if (item.attribute) {
                            try {
                                attribute = JSON.parse(item.attribute)
                            } catch (error) {
                                message.error("请检查属性字段")
                            }
                        }
                        return {
                            ...this.meta.addArgs,
                            ...item,
                            attribute,
                        }
                    })
                    // let postData = data.filters
                    console.log(data)
                    // await this.service.upInsert(data)
                    message.success("导入成功")
                    this.setState({ visibleImport: false })
                    this.refreshList()
                }}
            />
        )
    }
    renderSearchBar() {
        const { name, type_key, domain_key } = this.schema
        const filters = this.createFilters(
            {
                domain_key,
                type_key,
                name,
            },
            5
        )
        return this.createSearchBar(filters)
    }
}

export default List
