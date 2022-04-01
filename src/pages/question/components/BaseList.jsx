import { Form } from "@ant-design/compatible"
import "@ant-design/compatible/assets/index.css"
import schemas from "@/schemas"
import Authorized from "@/outter/fr-schema-antd-utils/src/components/Authorized/Authorized"
import MyInfoModal from "./InfoModal"
import InfoModal from "@/outter/fr-schema-antd-utils/src/components/Page/InfoModal"
import FileSaver from "file-saver"

import {
    Divider,
    Col,
    Modal,
    Button,
    Upload,
    message,
    Row,
    Spin,
    Empty,
    AutoComplete,
    DatePicker,
    Select,
    Input,
    List,
    Card,
    Tag,
} from "antd"

import React from "react"
import { schemaFieldType } from "@/outter/fr-schema/src/schema"
import * as _ from "lodash"
import clone from "clone"
import {
    DeleteOutlined,
    UploadOutlined,
    ExclamationCircleOutlined,
} from "@ant-design/icons"
import { exportDataByTemplate } from "@/outter/fr-schema-antd-utils/src/utils/xlsx"
import { checkedAndUpload } from "@/utils/minio"
import frSchema from "@/outter/fr-schema/src"
import { v4 as uuidv4 } from "uuid"
import { connect } from "dva"
import EditPage from "@/components/editTable/EditPage"
const { actions } = frSchema

import { downloadFile } from "@/utils/minio"
import { formatData } from "@/utils/utils"
const { RangePicker } = DatePicker
const { decorateList } = frSchema
const confirm = Modal.confirm
const Minio = require("minio")

@connect(({ global }) => ({
    dict: global.dict,
    data: global.data,
}))
@Form.create()
class BaseList extends EditPage {
    constructor(props) {
        const importTemplateUrl = "/import/掌数_知料_知识库信息导入.xlsx".replace(
            "//",
            "/"
        )
        let config =
            props.record.config && props.record.config.info_schema
                ? props.record.config.info_schema
                : {}

        Object.keys(config).forEach(function (key) {
            config[key].isExpand = true
            config[key].render = (data, item) => {
                return (
                    <div style={{ width: config[key].width || "80px" }}>
                        {item[key]}
                    </div>
                )
            }
        })
        let beforeSchema = {}
        let endSchema = {}
        Object.keys(schemas.question.schema).forEach(function (key) {
            if (schemas.question.schema[key].before) {
                beforeSchema[key] = schemas.question.schema[key]
            } else {
                endSchema[key] = schemas.question.schema[key]
            }
        })
        console.log(beforeSchema, endSchema)
        super(props, {
            operateWidth: 170,
            schema: clone({ ...beforeSchema, ...config, ...endSchema }),
            service: {
                ...schemas.question.service,
                get: schemas.question.service.getData,
            },
            allowExport: true,
            showSelect: true,
            showEdit: false,
            allowImport: true,
            expandKey: "info",
            infoProps: {
                offline: true,
                width: "1300px",
                isCustomize: true,
                customize: {
                    left: 10,
                    right: 14,
                },
            },
            importTemplateUrl,
        })
    }

    setBraftEditor() {
        this.schema.answer.props.media = {
            uploadFn: async (param) => {
                let fileUuid = uuidv4()
                let minioConfig = {}
                var minioClient = {}
                let bucketName = ""
                if (
                    !this.props.dict.config.minio_pattern ||
                    this.props.dict.config.minio_pattern.remark !== "server"
                ) {
                    minioConfig = (
                        await schemas.project.service.getMinioToken()
                    ).data
                    minioClient = new Minio.Client({
                        endPoint: minioConfig.endpoint,
                        port: parseInt(minioConfig.port),
                        useSSL: minioConfig.secure,
                        accessKey: minioConfig.AccessKeyId,
                        secretKey: minioConfig.SecretAccessKey,
                        sessionToken: minioConfig.SessionToken,
                    })
                    bucketName = minioConfig.bucket
                }
                checkedAndUpload(
                    bucketName,
                    param.file,
                    minioClient,
                    minioConfig,
                    fileUuid,
                    (res) => {
                        // 输出url
                        message.success(`文件上传成功`)
                        param.success({
                            url: res.url,
                            meta: {
                                loop: true, // 指定音视频是否循环播放
                                autoPlay: false, // 指定音视频是否自动播放
                                controls: false, // 指定音视频是否显示控制栏
                            },
                        })
                    },
                    () => {
                        message.error(`文件上传失败`)
                    },
                    this.props.dict.config.minio_pattern &&
                        this.props.dict.config.minio_pattern.remark === "server"
                        ? "server"
                        : "sdk"
                )
            },
        }
    }

    async componentDidMount() {
        this.setState({ showSearchBar: true })
        this.setBraftEditor()

        await super.componentDidMount()
    }

    /**
     * 查询当前数据
     * @returns {Promise<*>}
     */
    async requestList(tempArgs = {}) {
        const { queryArgs } = this.meta

        let searchParams = this.getSearchParam()

        const params = {
            ...(queryArgs || {}),
            ...searchParams,
            ...(this.state.pagination || {}),
            ...tempArgs,
        }

        let data = await this.service.get(params)
        await this.getDict()
        data = this.dataConvert(data)
        return data
    }

    async getDict() {
        const response = await this.service.getGroup({
            ...this.meta.queryArgs,
            select: "label,group",
            limit: 9999,
        })

        let labelDictList = {}
        let groupDictList = {}

        response.list.forEach((item) => {
            if (!_.isNil(item.label)) {
                item.label.forEach((value) => {
                    labelDictList[value] = {
                        value: value,
                        remark: value,
                    }
                })
            }
            if (!_.isNil(item.group)) {
                groupDictList[item.group] = {
                    value: item.group,
                    remark: item.group,
                }
            }
        })
        this.setState({
            attachment: [],
            loadingAnnex: false,
        })
        this.schema.label.dict = labelDictList
        this.schema.group.dict = groupDictList
        let options = []
        Object.keys(groupDictList).forEach(function (key) {
            options.push({
                key: groupDictList[key].value,
                value: groupDictList[key].value,
            })
        })
        this.schema.group.renderInput = (item, data) => {
            return (
                <AutoComplete
                    style={{ width: "100%", maxWidth: "300px" }}
                    filterOption={(inputValue, option) =>
                        option.value
                            .toUpperCase()
                            .indexOf(inputValue.toUpperCase()) !== -1
                    }
                    options={options}
                >
                    {/* {options} */}
                    <Input
                        placeholder="请输入分组"
                        onPressEnter={() => {
                            console.log("回车")
                        }}
                    ></Input>
                </AutoComplete>
            )
        }
    }

    renderTitle(item) {
        return (
            <div style={{ width: "100%", display: "flex" }}>
                <span style={{ flex: 1 }}>
                    <span style={{ fontWeight: "bold" }}>
                        {item.question_standard}
                    </span>
                    {item.label && item.label.length !== 0 && (
                        <span style={{ marginLeft: "10px" }}>
                            {item.label.map((item) => {
                                return (
                                    <Tag
                                        style={{ marginLeft: "3px" }}
                                        color="#2db7f5"
                                    >
                                        {item}
                                    </Tag>
                                )
                            })}
                        </span>
                    )}
                </span>
            </div>
        )
    }

    renderContent(item) {
        return (
            <>
                {/* {this.renderTitle(item)} */}
                <div style={{ color: "rgba(0,0,0,0.85)" }}>回复:</div>

                <div
                    style={{
                        p: {
                            marginTop: 0,
                            marginBottom: 0,
                        },
                        marginRight: "10px",
                        verticalAlign: "top",
                        display: "inline-block",
                        color: "rgba(0,0,0,0.85)",
                    }}
                    dangerouslySetInnerHTML={{
                        __html:
                            item.answer &&
                            item.answer.replace(
                                /<p>/g,
                                "<p style='margin:0;'>"
                            ),
                    }}
                />
                {item.attachment && item.attachment.length !== 0 && (
                    <>
                        <div>附件</div>
                        {item.attachment.map((itemStr, index) => {
                            let item = JSON.parse(itemStr)
                            return (
                                <a
                                    style={{
                                        marginRight: "20px",
                                    }}
                                    onClick={() => {
                                        let href = downloadFile(
                                            item.bucketName,
                                            item.fileName,
                                            item.url
                                        )
                                    }}
                                >
                                    {item.fileName}
                                </a>
                            )
                        })}
                    </>
                )}
                <div
                    style={{
                        width: "100%",
                        marginRight: "10px",

                        marginTop: "5px",
                        display: "flex",
                        // marginLeft: "4.2%",
                        // color: "rgba(0,0,0,0.85)",
                        // display: "inline-block",
                    }}
                >
                    <div
                        style={{
                            flex: 1,
                            display: "inline-block",
                        }}
                    >
                        {item.match_question_title === item.question_standard
                            ? "匹配标准文本："
                            : "匹配扩展文本："}
                        {item.match_question_title}
                    </div>
                    <div style={{ width: "130px", marginRight: "10px" }}>
                        <span
                            style={{
                                width: "130px",
                                textAlign: "right",
                                display: "inline-block",
                            }}
                        >
                            匹配度：
                            {item.compatibility === 1
                                ? "1.00000"
                                : formatData(item.compatibility || 0, 5)}
                        </span>
                    </div>
                </div>
            </>
        )
    }

    // 搜索
    renderSearchBar() {
        const {
            group,
            label,
            question_standard,
            create_time,
            update_time,
            answer,
        } = this.schema
        let groups = clone(group)
        let question_standards = clone(question_standard)
        question_standards.type = schemaFieldType.Input
        question_standards.props.placeholder = "请输入标准问"
        question_standards.span = 6
        // question_standards.title = (<div style={{ width: "56px" }}>分组</div>)
        groups.type = schemaFieldType.Select
        groups.renderInput = undefined
        groups.props.placeholder = "请输入分组"
        groups.span = 6
        // groups.title= (<div style={{width: '60px'}}>分组</div>)

        const filters = this.createFilters(
            {
                question_standard: question_standards,
                group: groups,
                // group,
                label: {
                    ...label,
                    type: schemaFieldType.Select,
                    span: 6,
                    props: null,
                },
                answer: {
                    ...answer,
                    type: schemaFieldType.Input,
                    extra: "",
                    props: {},
                    span: 6,
                },
                create_time: {
                    ...create_time,
                    style: { width: "100%" },
                    span: 6,
                    renderInput: () => {
                        return (
                            <RangePicker
                                allowEmpty={[true, true]}
                                style={{ width: "100%" }}
                                format="MM-DD HH:mm:ss"
                            ></RangePicker>
                        )
                    },
                },
                update_time: {
                    ...update_time,
                    // style: { width: "100%" },
                    span: 6,
                    renderInput: () => {
                        return (
                            <RangePicker
                                allowEmpty={[true, true]}
                                style={{ width: "100%" }}
                                format="MM-DD HH:mm:ss"
                            ></RangePicker>
                        )
                    },
                },
            },
            5
        )
        return this.createSearchBar(filters, {
            position: "absolute",
            right: "24px",
            top: "64px",
        })
    }

    renderSearchBarExtra() {
        return <Col xl={12}></Col>
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
                <Authorized
                    authority={this.meta.authority && this.meta.authority.add}
                    noMatch={null}
                >
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
                </Authorized>
                {this.meta.allowImport && (
                    <Authorized
                        authority={
                            this.meta.authority && this.meta.authority.export
                        }
                        noMatch={null}
                    >
                        <Button
                            onClick={() => {
                                this.setState({ visibleImport: true })
                            }}
                        >
                            导入
                        </Button>
                    </Authorized>
                )}
                {this.meta.allowExport && (
                    <Authorized
                        authority={
                            this.meta.authority && this.meta.authority.export
                        }
                        noMatch={null}
                    >
                        <Button
                            loading={this.state.exportLoading}
                            onClick={async () => {
                                this.setState(
                                    { exportLoading: true },
                                    async () => {
                                        let columns
                                        let data = await this.requestList({
                                            pageSize: 1000000,
                                            offset: 0,
                                        })
                                        data = decorateList(
                                            data.list,
                                            this.schema
                                        )
                                        // }
                                        let external_id = {
                                            title: "编号",
                                            dataIndex: "external_id",
                                            key: "external_id",
                                        }
                                        let answer = {
                                            title: "答案",
                                            dataIndex: "answer",
                                            key: "answer",
                                        }
                                        let question_extend = {
                                            title: "扩展问",
                                            dataIndex: "question_extend",
                                            key: "question_extend",
                                        }
                                        let recommend_text = {
                                            title: "推荐问",
                                            dataIndex: "recommend_text",
                                            key: "recommend_text",
                                        }
                                        let question_standard = {
                                            title: "标准问",
                                            dataIndex: "question_standard",
                                            key: "question_standard",
                                        }
                                        let group = {
                                            title: "分组",
                                            dataIndex: "group",
                                            key: "group",
                                        }
                                        let label = {
                                            title: "标签",
                                            dataIndex: "label",
                                            key: "label",
                                        }
                                        let global_key = {
                                            title: "全局变量",
                                            dataIndex: "global_key",
                                            key: "global_key",
                                        }
                                        let info = {
                                            title: "其他",
                                            dataIndex: "info",
                                            key: "info",
                                        }
                                        columns = [
                                            external_id,
                                            question_standard,
                                            group,
                                            label,
                                            global_key,
                                            answer,
                                            question_extend,
                                            recommend_text,
                                            info,
                                        ]
                                        await exportDataByTemplate(
                                            this.props.record.name,
                                            data,
                                            columns,
                                            "/import/掌数_知料_知识库信息导入.xlsx"
                                        )
                                        this.setState({ exportLoading: false })
                                    }
                                )
                            }}
                        >
                            导出
                        </Button>
                    </Authorized>
                )}

                <Button
                    onClick={() => {
                        this.setState({ visibleMatchDel: true })
                    }}
                >
                    匹配删除
                </Button>
            </>
        )
    }

    renderOperateColumnExtend(record) {
        return (
            <>
                <Divider type="vertical" />
                <a
                    onClick={() =>
                        this.handleVisibleModal(true, record, actions.edit)
                    }
                >
                    回复详情
                </a>
                <Divider type="vertical" />
                <a
                    onClick={() => {
                        this.setState({
                            showAnnex: true,
                            record: record,
                            isUpload: false,
                            attachment: clone(record.attachment),
                        })
                    }}
                >
                    附件
                </a>{" "}
            </>
        )
    }

    async handleAddBefore(args) {
        let searchData = await schemas.question.service.search({
            compatibility: 0.9,
            search: args.question_standard,
            limit: 10,
            project_id: this.props.record.id,
            domain_key: this.props.record.domain_key,
        })
        // this.handleAdd(args)
        if (
            searchData.list &&
            searchData.list.length &&
            searchData.list[0].compatibility > 0.9
        ) {
            this.setState({
                visibleModalAlreadyHave: true,
                alreadyHaveLoading: false,
                searchData: searchData.list,
                addArgs: args,
            })
        } else {
            // this.setState({loadingSubmit: true})
            await this.handleAdd(
                { ...args, domain_key: this.props.record.domain_key },
                this.schema
            )
        }
    }

    renderAlreadyHave() {
        return (
            <Modal
                visible={this.state.visibleModalAlreadyHave}
                // visible={true}
                width={"800px"}
                onCancel={() =>
                    this.setState({ visibleModalAlreadyHave: false })
                }
                confirmLoading={this.state.alreadyHaveLoading}
                onOk={async () => {
                    this.setState({ alreadyHaveLoading: true })
                    await this.handleAdd(
                        {
                            ...this.state.addArgs,
                            domain_key: this.props.record.domain_key,
                        },
                        this.schema
                    )
                    this.setState({
                        visibleModalAlreadyHave: false,
                        alreadyHaveLoading: false,
                    })
                }}
                title={"问题库中存在相似问，是否继续添加"}
            >
                <Card>
                    <List
                        style={{
                            maxHeight: "600px",
                            overflowY: "auto",
                            position: "relative",
                        }}
                        itemLayout="horizontal"
                        dataSource={this.state.searchData}
                        renderItem={(item) => (
                            <List.Item>
                                <List.Item.Meta
                                    title={this.renderTitle(item)}
                                    description={this.renderContent(item)}
                                />
                                {/* <div>{renderDescription(item)}</div> */}
                            </List.Item>
                        )}
                    />
                </Card>
            </Modal>
        )
    }

    /**
     * 渲染信息弹出框
     * @param customProps 定制的属性
     * @returns {*}
     */
    renderInfoModal(customProps = {}) {
        if (this.props.renderInfoModal) {
            return this.props.renderInfoModal()
        }
        const renderForm = this.props.renderForm || this.renderForm
        const { resource, title, addArgs } = this.meta
        const { visibleModal, infoData, action } = this.state
        const updateMethods = {
            handleVisibleModal: this.handleVisibleModal.bind(this),
            handleUpdate: (args) => {
                console.log(this.state)
                let editData = this.state.editRow.filter((item) => {
                    return item.id === args.id
                })

                console.log(args)
                let data =
                    editData && editData[0]
                        ? { ...editData[0], answer: args.answer }
                        : { ...this.state.infoData, ...args }
                this.editData(data)
                this.setState({ visibleModal: false })
            },
            handleAdd: this.handleAddBefore.bind(this),
        }

        let infoProps = {}
        if (action !== "edit") {
            infoProps = this.meta.infoProps
        } else {
            infoProps = {
                offline: true,
            }
        }
        if (action !== "edit") {
            return (
                visibleModal && (
                    <InfoModal
                        renderForm={renderForm}
                        title={action !== "edit" ? title : "回复"}
                        action={action}
                        width={"800px"}
                        resource={resource}
                        {...updateMethods}
                        visible={visibleModal}
                        values={infoData}
                        addArgs={addArgs}
                        meta={this.meta}
                        service={this.service}
                        schema={
                            action !== "edit"
                                ? this.schema
                                : {
                                      answer: this.schema.answer,
                                      answer_text: {
                                          ...this.schema.answer_text,
                                          itemProps: {
                                              labelCol: {
                                                  span: 4,
                                              },
                                          },
                                          lineWidth: "480px",
                                      },
                                      recommend_text: {
                                          ...this.schema.recommend_text,
                                          itemProps: {
                                              labelCol: {
                                                  span: 4,
                                              },
                                          },
                                          lineWidth: "480px",
                                      },
                                  }
                        }
                        {...customProps}
                        {...infoProps}
                    />
                )
            )
        } else {
            return (
                visibleModal && (
                    <MyInfoModal
                        renderForm={renderForm}
                        title={
                            <div
                                style={{
                                    overflow: "hidden", //超出的文本隐藏
                                    textOverflow: "ellipsis", //用省略号显示
                                    whiteSpace: "nowrap", //不换行
                                    width: "200px",
                                    marginLeft: "-12px",
                                }}
                            >
                                {action !== "edit"
                                    ? title
                                    : "回复(" +
                                      infoData.question_standard +
                                      ")"}
                            </div>
                        }
                        action={action}
                        width={"800px"}
                        resource={resource}
                        {...updateMethods}
                        visible={visibleModal}
                        values={infoData}
                        addArgs={addArgs}
                        meta={this.meta}
                        service={this.service}
                        schema={
                            action !== "edit"
                                ? this.schema
                                : {
                                      answer: {
                                          ...this.schema.answer,
                                          position: "left",
                                      },
                                      answer_text: {
                                          ...this.schema.answer_text,
                                          itemProps: {
                                              labelCol: {
                                                  span: 4,
                                              },
                                          },
                                          lineWidth: "480px",
                                      },
                                      recommend_text: {
                                          ...this.schema.recommend_text,
                                          itemProps: {
                                              labelCol: {
                                                  span: 4,
                                              },
                                          },
                                          lineWidth: "480px",
                                      },
                                  }
                        }
                        {...customProps}
                        {...infoProps}
                    />
                )
            )
        }
    }

    handleUpload = async (file) => {
        this.setState({
            loadingAnnex: true,
        })
        let minioConfig = {}
        var minioClient = {}
        let bucketName = ""
        if (
            !this.props.dict.config.minio_pattern ||
            this.props.dict.config.minio_pattern.remark !== "server"
        ) {
            minioConfig = (await schemas.project.service.getMinioToken()).data
            minioClient = new Minio.Client({
                endPoint: minioConfig.endpoint,
                port: parseInt(minioConfig.port),
                useSSL: minioConfig.secure,
                accessKey: minioConfig.AccessKeyId,
                secretKey: minioConfig.SecretAccessKey,
                sessionToken: minioConfig.SessionToken,
            })
            bucketName = minioConfig.bucket
        }

        try {
            checkedAndUpload(
                bucketName,
                file,
                minioClient,
                minioConfig,
                uuidv4(),
                (res) => {
                    console.log(res)
                    message.success(`文件上传成功`)
                    let attachment = []
                    if (this.state.attachment)
                        attachment = clone(this.state.attachment)
                    attachment.push(res)
                    this.setState({
                        attachment,
                        loadingAnnex: false,
                        isUpload: true,
                    })
                },
                () => {
                    message.error(`文件上传失败`)
                    this.setState({
                        loadingAnnex: false,
                        isUpload: true,
                    })
                },
                this.props.dict.config.minio_pattern &&
                    this.props.dict.config.minio_pattern.remark === "server"
                    ? "server"
                    : "sdk"
            )
        } catch (error) {
            message.error("上传失败")
        }

        return false
    }

    renderExtend() {
        const props = {
            name: "file",
            headers: {
                authorization: "authorization-text",
            },
            maxCount: 1,
            itemRender: () => {
                ;<></>
            },
            beforeUpload: (file) => {
                this.handleUpload(file)
                return false
            },
        }

        const footer = (
            <>
                <Row style={{ height: "32px", overflow: "hidden" }} gutter={24}>
                    <Col lg={16}>
                        <Upload {...props}>
                            <Button icon={<UploadOutlined />}>上传附件</Button>
                        </Upload>
                    </Col>
                    <Col lg={8}>
                        <Button
                            onClick={() => {
                                confirm({
                                    title: "提示",
                                    content: "关闭对话框将不会保留未确认内容！",
                                    okText: "关闭",
                                    cancelText: "取消",
                                    onOk: () => {
                                        this.setState({
                                            showAnnex: false,
                                            loadingAnnex: false,
                                        })
                                    },
                                    onCancel: () => {
                                        return
                                    },
                                })
                            }}
                        >
                            取消
                        </Button>
                        <Button
                            type="primary"
                            onClick={async () => {
                                await this.service.patch(
                                    {
                                        id: this.state.record.id,
                                        attachment: this.state.attachment,
                                        domain_key: this.props.record
                                            .domain_key,
                                    },
                                    this.schema
                                )
                                message.success("修改成功！")
                                this.setState({
                                    showAnnex: false,
                                })
                                this.refreshList()
                            }}
                        >
                            确定
                        </Button>
                    </Col>
                </Row>
            </>
        )
        return (
            <>
                {this.state.showAnnex && (
                    <Modal
                        visible={this.state.showAnnex}
                        title={"附件管理"}
                        onCancel={() => {
                            confirm({
                                title: "提示",
                                content: "关闭对话框将不会保留未确认内容！",
                                okText: "关闭",
                                cancelText: "取消",
                                onOk: () => {
                                    this.setState({ showAnnex: false })
                                },
                                onCancel: () => {
                                    this.setState({ showAnnex: false })
                                },
                            })
                        }}
                        footer={footer}
                    >
                        <Spin
                            spinning={this.state.loadingAnnex}
                            tip="文件上传中..."
                        >
                            <div>
                                <ul
                                    style={{
                                        margin: "25px 0 0",
                                        padding: "0",
                                        listStyle: "none",
                                    }}
                                >
                                    {this.state.attachment &&
                                        this.state.attachment.map(
                                            (item, index) => {
                                                let itemObj = item
                                                if (typeof item === "string")
                                                    itemObj = JSON.parse(item)
                                                return (
                                                    <li
                                                        key={itemObj.fileName}
                                                        style={{
                                                            display: "flex",
                                                            alignItems:
                                                                "center",
                                                            marginTop: "16px",
                                                            zoom: 1,
                                                        }}
                                                    >
                                                        <span
                                                            style={{
                                                                display:
                                                                    "inline-block",
                                                                width: "20px",
                                                                height: "20px",
                                                                marginTop:
                                                                    "1.5px",
                                                                marginRight:
                                                                    "16px",
                                                                fontWeight:
                                                                    "600",
                                                                fontSize:
                                                                    "12px",
                                                                lineHeight:
                                                                    "20px",
                                                                textAlign:
                                                                    "center",
                                                                // backgroundColor: @tag-default-bg;
                                                                borderRadius:
                                                                    "20px",
                                                                color: "#fff",
                                                                backgroundColor:
                                                                    "#314659",
                                                            }}
                                                        >
                                                            {index + 1}
                                                        </span>
                                                        <span
                                                            style={{
                                                                flex: 1,
                                                                marginRight:
                                                                    "8px",
                                                                overflow:
                                                                    "hidden",
                                                                whiteRpace:
                                                                    "nowrap",
                                                                textOverflow:
                                                                    "ellipsis",
                                                            }}
                                                            title={
                                                                itemObj.fileName
                                                            }
                                                        >
                                                            {itemObj.fileName}
                                                        </span>
                                                        <a
                                                            onClick={() => {
                                                                let attachment = this
                                                                    .state
                                                                    .attachment
                                                                attachment.splice(
                                                                    index,
                                                                    1
                                                                )
                                                                this.setState({
                                                                    attachment: clone(
                                                                        attachment
                                                                    ),
                                                                })
                                                            }}
                                                        >
                                                            <DeleteOutlined />
                                                        </a>
                                                    </li>
                                                )
                                            }
                                        )}
                                    {(!this.state.attachment ||
                                        !this.state.attachment.length) && (
                                        <Empty
                                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                                        />
                                    )}
                                </ul>
                            </div>
                        </Spin>
                    </Modal>
                )}
                {this.state.visibleModalAlreadyHave && this.renderAlreadyHave()}
                {this.state.visibleMatchDel && this.renderMatchDelModal()}
            </>
        )
    }

    handleSearch = (fieldsValue) => {
        if (fieldsValue["label"] && fieldsValue["label"].length) {
            fieldsValue.label = "ov.{" + fieldsValue["label"] + "}"
        } else {
            fieldsValue.label = undefined
        }
        this.onSearch(fieldsValue)
    }

    handleVisibleImportModal = (flag, record, action) => {
        this.setState({
            visibleImport: !!flag,
            infoData: record,
            action,
        })
    }
    handleVisibleMatchDel = (flag, record, action) => {
        this.setState({
            visibleMatchDel: !!flag,
            infoData: record,
            action,
        })
    }

    renderImportModal() {
        if (this.props.renderInfoModal) {
            return this.props.renderInfoModal()
        }
        const { form } = this.props
        const renderForm = this.props.renderForm || this.renderForm
        const { resource, title, addArgs } = this.meta
        const { visibleImport, infoData, action } = this.state
        const updateMethods = {
            handleVisibleModal: this.handleVisibleImportModal.bind(this),
            handleUpdate: this.handleUpdate.bind(this),
            handleAdd: this.handleUploadExcel.bind(this),
        }

        const schema = {
            download: {
                title: "下载",
                renderInput: () => {
                    return (
                        <a
                            onClick={async () => {
                                FileSaver(
                                    "/import/掌数_知料_知识库信息导入.xlsx",
                                    "掌数_知料_知识库信息导入"
                                )
                            }}
                        >
                            <Button>下载模板文件</Button>
                        </a>
                    )
                },
            },
            file: {
                title: "文件",
                required: true,
                extra: "图片导入仅支持wps编辑的.xlsx文件",
                type: schemaFieldType.Upload,
            },
        }

        return (
            visibleImport && (
                <InfoModal
                    renderForm={renderForm}
                    title={"导入"}
                    action={action}
                    resource={resource}
                    {...updateMethods}
                    visible={visibleImport}
                    values={infoData}
                    addArgs={addArgs}
                    meta={this.meta}
                    service={this.service}
                    schema={schema}
                    width={600}

                    // {...customProps}
                />
            )
        )
    }

    renderMatchDelModal() {
        if (this.props.renderInfoModal) {
            return this.props.renderInfoModal()
        }
        const { form } = this.props
        const renderForm = this.props.renderForm || this.renderForm
        const { resource, title, addArgs } = this.meta
        const { visibleMatchDel, infoData, action } = this.state
        const updateMethods = {
            handleVisibleModal: this.handleVisibleMatchDel.bind(this),
            handleUpdate: this.handleUpdate.bind(this),
            handleAdd: this.handleMatchDel.bind(this),
        }

        const schema = {
            external_id: {
                title: "外部编号",
                extra: "每行表示一个外部编号",
                required: true,
                type: schemaFieldType.TextArea,
                props: {
                    autoSize: { minRows: 2, maxRows: 6 },
                },
            },
        }

        return (
            visibleMatchDel && (
                <InfoModal
                    renderForm={renderForm}
                    title={"根据外部编号进行删除"}
                    action={"add"}
                    resource={resource}
                    {...updateMethods}
                    visible={visibleMatchDel}
                    values={infoData}
                    addArgs={addArgs}
                    meta={this.meta}
                    service={this.service}
                    schema={schema}
                    width={600}

                    // {...customProps}
                />
            )
        )
    }

    async refreshList() {
        this.setState({ listLoading: true }, async () => {
            let data = await this.requestList()
            let list = decorateList(data.list, this.schema)
            this.convertList && (list = this.convertList(list))

            this.setState({
                selectedRows: [],
                data: {
                    ...data,
                    list,
                },
                listLoading: false,
            })
            // let { list } = this.state.data
            this.state.editRow.map((item) => {
                list.map((listItem, index) => {
                    if (item.id === listItem.id) {
                        list[index] = item
                    }
                })
            })
            this.setState({
                data: { ...this.state.data, list: [...list] },
                otherFooter:
                    "总扩展问数量：" + this.state.data.question_extend_count,
            })
        })
    }
    async handleUploadExcel(data, schema) {
        // 更新
        let response
        try {
            response = await this.service.uploadExcel(
                { ...data, file: data.file.file },
                schema
            )
        } catch (error) {
            message.error(error.message)
            this.handleVisibleImportModal()
            return
        }

        this.refreshList()
        message.success("添加成功")
        this.handleVisibleImportModal()
        this.handleChangeCallback && this.handleChangeCallback()
        this.props.handleChangeCallback && this.props.handleChangeCallback()

        return response
    }

    async handleMatchDel(data, schema) {
        // 更新
        let response
        try {
            response = await this.service.matchDel({ ...data }, schema)
        } catch (error) {
            message.error(error.message)
            return
        }

        this.refreshList()
        message.success("删除成功")
        this.handleVisibleMatchDel()
        this.handleChangeCallback && this.handleChangeCallback()
        this.props.handleChangeCallback && this.props.handleChangeCallback()

        return response
    }

    // 数据扩展
    dataExtra(item) {
        item.question_extend = item.question_extend
            ? item.question_extend.split("\n")
            : []
        item.recommend_text = item.recommend_text
            ? item.recommend_text.split("\n")
            : []
    }
}

export default BaseList
