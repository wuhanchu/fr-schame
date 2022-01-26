import React, { Fragment } from "react"
import frSchemaUtils from "@/outter/fr-schema-antd-utils/src"
import { autobind } from "core-decorators"
import frSchema from "@/outter/fr-schema/src"

const { decorateList } = frSchema
const { DataList } = frSchemaUtils.components
import EditTable from "@/components/editTable/EditTable"
import { Button, message, Card } from "antd"
import * as _ from "lodash"
import styles from "@/outter/fr-schema-antd-utils/src/components/Page/DataList.less"

import { schemaFieldType } from "@/outter/fr-schema/src/schema"

@autobind
class EditPage extends DataList {
    async componentDidMount() {
        super.componentDidMount()
        // 提醒页面刷新
        window.onbeforeunload = function (e) {
            let dialogText = "重新加载此网站？"
            e.returnValue = dialogText
            return dialogText
        }
        let commitParamStr = this.state.commitParamStr || [
            "id",
            "project_id",
            "answer",
        ]
        this.setState({
            editRow: [],
            commitParamStr: [...commitParamStr],
            updateLoading: false,
        })
    }

    componentWillUnmount() {
        // 关闭提醒
        window.onbeforeunload = function (e) {
            e.preventDefault()
        }
    }

    /**fa
     * 渲染表格
     * @param inProps
     * @returns {*}
     */
    renderList(inProps = {}) {
        let { loading } = this.props
        const { showSelect, scroll, mini, tableSelectAll } = this.meta
        let {
            data,
            listLoading,
            selectedRows,
            tableFooter,
            otherFooter,
        } = this.state

        // judge weather hide select
        let otherProps = {}

        if (!showSelect) {
            otherProps.rowSelection = null
        }

        if (scroll) {
            otherProps.scroll = scroll
        }

        if (mini) {
            otherProps.pagination = false
        }

        const columns = this.getColumns()

        let footer = ""

        // 列表底部 显示统计数据(如金额)
        tableFooter &&
            tableFooter.map((item) => (footer += this.reduceTableTotal(item)))

        if (otherFooter) {
            footer = otherFooter + " " + footer
        }
        if (footer) {
            otherProps.footer = () => <div>{footer}</div>
        }

        return (
            <EditTable
                bordered={true}
                rowKey={this.meta.idKey || "id"}
                rowType={this.meta.rowType || "checkbox"}
                selectedRows={selectedRows}
                tableSelectAll={tableSelectAll}
                loading={!data || loading || listLoading}
                data={data}
                columns={columns}
                size={"small"}
                onSelectRow={this.handleSelectRows}
                onChange={this.handleStandardTableChange}
                onEditDataChange={this.editData}
                {...otherProps}
                {...inProps}
            />
        )
    }
    render() {
        const { visibleModal, visibleImport } = this.state
        let {
            renderOperationBar,
            renderSearchBar,
            renderOperateColumn,
        } = this.props

        // 操作栏
        let operationBar = null
        operationBar = this.renderOperationBar && this.renderOperationBar()
        if (renderOperationBar) {
            operationBar = renderOperationBar()
        }

        // 搜索栏
        let searchBar = null
        if (renderSearchBar) {
            searchBar = renderSearchBar()
        } else if (renderSearchBar !== null) {
            searchBar = this.renderSearchBar && this.renderSearchBar()
        }

        return (
            <Fragment>
                <Card bordered={false} style={{ width: "100%" }}>
                    {this.state.showSearchBar && (
                        <div className={styles.tableListForm}>{searchBar}</div>
                    )}
                    <div className={styles.tableList}>
                        {this.renderSearchForm && (
                            <div className={styles.tableListForm}>
                                {this.renderSearchForm()}
                            </div>
                        )}
                        {this.state.showSearchBar && operationBar}
                        {this.renderList()}
                    </div>
                </Card>
                {visibleModal && this.renderInfoModal()}
                {visibleImport && this.renderImportModal()}
                {this.renderExtend && this.renderExtend()}
            </Fragment>
        )
    }

    async refreshList() {
        if (!this.service || this.props.offline) {
            this.setState({
                data: {
                    ...(this.state.data || {}),
                    list:
                        decorateList(
                            this.state.data && this.state.data.list,
                            this.schema
                        ) || [],
                },
                listLoading: false,
            })
            return
        }

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
            })
        })
    }
    renderOperationExtend() {
        return (
            <>
                {this.state.editRow && this.state.editRow.length > 0 && (
                    <Button type="primary" onClick={this.resetEditData}>
                        重置修改
                    </Button>
                )}
                {this.state.editRow && this.state.editRow.length > 0 && (
                    <Button
                        type="primary"
                        onClick={this.onPatchEditData}
                        loading={this.state.updateLoading}
                    >
                        保存修改
                    </Button>
                )}
            </>
        )
    }

    // 修改数据
    editData(record) {
        let newData = [...this.state.data.list]
        let idx = this.state.editRow.findIndex((value) => {
            return value.id === record.id
        })
        if (idx !== -1) {
            this.state.editRow.splice(idx, 1, { ...record })
        } else {
            this.state.editRow.push(record)
        }
        const index = newData.findIndex((item) => record.id === item.id)
        const item = newData[index]
        newData.splice(index, 1, { ...item, ...record })
        newData = this.formatData(newData, this.schema)
        this.setState({
            data: { ...this.state.data, list: [...newData] },
            editRow: [...this.state.editRow],
        })
    }

    // 数据处理
    formatData(list, schema) {
        return list.map((item) => {
            return this.formatItem(item, schema)
        })
    }

    formatItem(item, schema) {
        Object.keys(schema).forEach((key) => {
            switch (schema[key].type) {
                case schemaFieldType.MultiSelect:
                case schemaFieldType.Select:
                    if (item[key] instanceof Array) {
                        item[key + "_remark"] =
                            !_.isEmpty(item[key]) && item[key].join("|")
                    }
                    break
                default:
                    break
            }
        })
        return item
    }

    // 重置修改数据
    resetEditData() {
        this.setState({
            data: { ...this.state.data, list: [...this.state.initList] },
            editRow: [],
        })
        this.refreshList()
    }

    // 点击保存修改
    async onPatchEditData() {
        if (this.state.editRow.length === 0) {
            message.info("您目前暂未修改任何数据")
            return
        }
        this.setState({ listLoading: true, updateLoading: true })
        // 获取所有编辑的字段
        for (let param in this.schema) {
            if (this.schema[param].editable) {
                this.state.commitParamStr.push(param)
            }
        }
        // 数据处理-> 只保留编辑的字段 无用字段去除
        for (let i = 0; i < this.state.editRow.length; i++) {
            let item = {}
            for (let j = 0; j < this.state.commitParamStr.length; j++) {
                item[this.state.commitParamStr[j]] =
                    this.state.editRow[i][this.state.commitParamStr[j]] !==
                    undefined
                        ? this.state.editRow[i][this.state.commitParamStr[j]]
                        : null
            }
            this.dataExtra(item)
            this.state.editRow[i] = { ...item }
        }
        try {
            await this.updateService()
            this.refreshList()
            message.success("保存成功")
        } catch (error) {
            message.error(error.message)
        }

        this.setState({ editRow: [], listLoading: false, updateLoading: false })
    }

    /**
     * 个性化转换对应的list数据
     * @param list
     * @returns {*}
     */
    convertList(list) {
        this.setState({ initList: list })
        return list
    }

    // 数据扩展
    dataExtra(item) {}

    // 修改接口
    async updateService() {
        let expandSchema = Object.keys(this.schema).filter((item) => {
            return this.schema[item].isExpand
        })
        let editRow = this.state.editRow
        let expandKey = this.meta.expandKey
        expandSchema.map((expandItem) => {
            editRow = editRow.map((item, index) => {
                item[expandKey] = { ...item[expandKey] }
                if (item[expandItem])
                    item[expandKey][expandItem] = item[expandItem]
                item[expandItem] = undefined
                return item
            })
        })
        await this.service.upInsert(this.state.editRow)
    }

    /**
     * 充值查询
     */
    handleFormReset = () => {
        const { order } = this.props

        this.formRef.current.resetFields()
        this.setState(
            {
                pagination: { ...this.state.pagination, currentPage: 1 },
                searchValues: { order },
                editRow: [],
            },
            () => {
                this.refreshList()
            }
        )
    }
}

export default EditPage
