import React, { Fragment } from "react"
import frSchemaUtils from "@/outter/fr-schema-antd-utils/src"
import { autobind } from "core-decorators"
import frSchema from "@/outter/fr-schema/src"

const { decorateList } = frSchema

const { DataList } = frSchemaUtils.components
import EditTable from "@/components/editTable/EditTable"
import { Button, message } from "antd"

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
        let commitParamStr = this.state.commitParamStr || ["id", "project_id"]
        this.setState({ editRow: [], commitParamStr: [...commitParamStr] })
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
        let { data, listLoading, selectedRows, tableFooter } = this.state

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

    renderOperationExtend() {
        return (
            <Button type="primary" onClick={this.onPatchEditData}>
                保存修改
            </Button>
        )
    }

    // 修改数据
    editData(record) {
        let newData = [...this.state.data.list]
        this.state.editRow.push(record)
        const index = newData.findIndex((item) => record.id === item.id)
        const item = newData[index]
        newData.splice(index, 1, { ...item, ...record })
        newData = decorateList(newData, this.schema) // 显示数据处理
        this.setState({
            data: { ...this.state.data, list: [...newData] },
            editRow: [...this.state.editRow],
        })
    }

    // 点击保存修改
    async onPatchEditData() {
        if (this.state.editRow.length === 0) {
            message.info("您目前暂未修改任何数据")
            return
        }
        this.setState({ listLoading: true })
        let obj = {}
        // 过滤重复数据
        this.state.editRow = this.state.editRow.reduce(function (item, next) {
            obj[next.id] ? "" : (obj[next.id] = true && item.push(next))
            return item
        }, [])
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
                item[this.state.commitParamStr[j]] = this.state.editRow[i][
                    this.state.commitParamStr[j]
                ]
            }
            this.dataExtra(item)
            this.state.editRow[i] = { ...item }
        }
        await this.updateService()
        message.success("保存成功")
        this.setState({ editRow: [], listLoading: false })
    }

    // 数据扩展
    dataExtra(item) {}

    // 修改接口
    async updateService() {
        await this.service.upInsert(this.state.editRow)
    }
}

export default EditPage