import React from "react"
import { Input, Tag, Form, Button, Space, Row, Col } from "antd"
import { useExperimentGraph } from "@/pages/flow/rx-models/experiment-graph"
import "antd/lib/style/index.css"
import { FolderAddTwoTone } from "@ant-design/icons"
import Modal from "antd/lib/modal/Modal"
import clone from "clone"
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons"

function Random(min, max) {
    return Math.round(Math.random() * (max - min)) + min
}

export const FormModal = ({
    experimentId,
    visible,
    handleVisible,
    actionType,
    type,
    setActions,
    setConditions,
    conditions,
    actions,
    keyIndex,
    conditionList,
    nodeId,
    defaultValue,
}) => {
    const [form] = Form.useForm()

    const expGraph = useExperimentGraph(experimentId)
    let { action, condition } = expGraph.formData
    let initialValues = clone(defaultValue)
    let slot = []
    if (defaultValue.slot) {
        Object.keys(defaultValue.slot).forEach(function (key) {
            console.log(key, defaultValue.slot[key])
            slot.push({ first: key, last: defaultValue.slot[key] })
        })
    }

    initialValues.slot = slot
    console.log("conditionList", conditionList)
    if (!conditionList) {
        conditionList = []
    }
    const onFinish = (values) => {
        console.log(values)
        let slot = {}
        let myActions = clone(actions)
        let myConditions = clone(conditions)

        values.slot &&
            values.slot.map((item) => {
                slot[item.first] = item.last
            })

        if (type === "condition") {
            if (actionType === "add") {
                let conditionKey = keyIndex + Random(0, 100000)
                myConditions.push({
                    ...values,
                    key: conditionKey,
                    slot,
                })
                conditionList.push(conditionKey)
                if (nodeId) {
                    expGraph.renameNode(nodeId, { condition: conditionList })
                }
                let expGraphConition = [...expGraph.formData.condition]
                expGraphConition.push({
                    ...values,
                    key: conditionKey,
                    slot,
                })
                expGraph.formData.condition = expGraphConition

                setConditions(myConditions)
                console.log(expGraph)
            } else {
                // actions.f
                // let data = expGraph.formData.condition.filter((item)=>{return item.key === defaultValue.key})
                if (expGraph.formData.condition) {
                    myConditions = myConditions.map((item) => {
                        if (item.key === defaultValue.key) {
                            return { ...values, slot, key: defaultValue.key }
                        }
                        return item
                    })
                    setConditions(myConditions)
                    expGraph.formData.condition = expGraph.formData.condition.map(
                        (item) => {
                            console.log(item)
                            if (item.key === defaultValue.key) {
                                return {
                                    ...values,
                                    slot,
                                    key: defaultValue.key,
                                }
                            }
                            return item
                        }
                    )
                }
            }
        }
        handleVisible(false)
        console.log("Success:", values)
    }

    const onFinishFailed = (errorInfo) => {
        console.log("Failed:", errorInfo)
    }
    return (
        <Modal
            title={"条件"}
            visible={visible}
            footer={false}
            onCancel={() => handleVisible(false)}
        >
            <Form
                name="basic"
                labelCol={{ span: 8 }}
                wrapperCol={{ span: 12 }}
                initialValues={initialValues}
                onFinish={onFinish}
                onFinishFailed={onFinishFailed}
            >
                <Form.Item
                    label="名称"
                    name="name"
                    rules={[{ required: true, message: "请输入用户名！" }]}
                >
                    <Input placeholder={"请输入用户名"} />
                </Form.Item>

                <Form.Item
                    label="意图"
                    name="intent"
                    // rules={[{ required: true, message: "请输入意图！" }]}
                >
                    <Input placeholder={"请输入意图"} />
                </Form.Item>
                <Form.Item
                    label="节点重复次数"
                    name="node_report_time"
                    // rules={[
                    //     { required: true, message: "请输入节点重复次数！" },
                    // ]}
                >
                    <Input placeholder={"请输入节点重复次数"} />
                </Form.Item>
                {/* <Form.Item
                    label="插槽"
                    name="slot"
                    rules={[
                        { required: true, message: "请输入插槽！" },
                    ]}
                >
                    <Input placeholder={"请输入节点重复次数"}/>
                </Form.Item> */}
                <Form.List name="slot">
                    {(fields, { add, remove }) => (
                        <>
                            {fields.map(
                                ({ key, name, fieldKey, ...restField }) => (
                                    <Space
                                        key={key}
                                        style={{ display: "flex" }}
                                        align="baseline"
                                    >
                                        <Form.Item
                                            {...restField}
                                            wrapperCol={{ offset: 8, span: 12 }}
                                            name={[name, "first"]}
                                            fieldKey={[fieldKey, "first"]}
                                            rules={[
                                                {
                                                    required: true,
                                                    message: "请输入键名",
                                                },
                                            ]}
                                        >
                                            <Input placeholder="键名" />
                                        </Form.Item>
                                        <Form.Item
                                            {...restField}
                                            name={[name, "last"]}
                                            fieldKey={[fieldKey, "last"]}
                                            rules={[
                                                {
                                                    required: true,
                                                    message: "请输入键值",
                                                },
                                            ]}
                                        >
                                            <Input
                                                style={{
                                                    width: "236px",
                                                    marginLeft: "-26px",
                                                }}
                                                placeholder="键值"
                                            />
                                        </Form.Item>
                                        <MinusCircleOutlined
                                            onClick={() => remove(name)}
                                        />
                                    </Space>
                                )
                            )}
                            <Form.Item wrapperCol={{ offset: 8, span: 12 }}>
                                {/* <Button type="dashed" style={{ float: 'right', width: '236px', position: 'absolute', right: '0px' }} onClick={() => add()} block icon={<PlusOutlined />}>
                                    添加插槽
                                </Button> */}
                                <Row gutter={24}>
                                    <Col lg={16}>
                                        <Button
                                            onClick={() => add()}
                                            block
                                            icon={<PlusOutlined />}
                                        >
                                            添加插槽
                                        </Button>
                                    </Col>
                                    <Col lg={8}>
                                        <Button
                                            style={{ float: "right" }}
                                            type="primary"
                                            htmlType="submit"
                                        >
                                            提交
                                        </Button>
                                    </Col>
                                </Row>
                            </Form.Item>
                        </>
                    )}
                </Form.List>
            </Form>
        </Modal>
    )
}