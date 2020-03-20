import React, { Fragment } from "react"
import {
    Divider,
    Form,
    Popconfirm,
    Modal,
    Spin,
    Avatar,
    Row,
    Col,
    Input,
    Button,
    Card
} from "antd"
import schemas from "@/schemas"
import CharRecords from "@/components/Extra/Chat/ChatRecords"
import mySvg from "../../../assets/userhead.svg"
import rebotSvg from "../../../assets/rebot.svg"

class Dialogue extends React.Component {
    state = {
        sendValue: "",
        isSpin: false,
        data: [
            {
                actions: null,
                content: "您有什么问题？",
                id: 0,
                role: "my"
            }
        ]
    }

    handleSend = async sendValue => {
        const { record } = this.props

        this.state.data.push({
            actions: null,
            content: sendValue,
            id: this.state.data.length + 1,
            role: "interlocutors"
        })
        let card = document.getElementById("card")
        setTimeout(() => {
            card.scrollTop = card.scrollHeight
        }, 10)
        this.setState({ data: this.state.data, sendValue: "", isSpin: true })
        const response = await schemas.question.service.search({
            search: sendValue.replace(/\s+/g, "|"),
            project_id: record.id
        })
        let list
        if (response.list.length > 3) {
            list = response.list.slice(0, 3)
        } else {
            list = response.list
        }
        this.state.data.push({
            content: (
                <div
                    dangerouslySetInnerHTML={{
                        __html:
                            response.list[0] &&
                            response.list[0].answer_mark &&
                            response.list[0].compatibility > 0.9
                                ? response.list[0].answer_mark
                                : "暂时未找到您要的信息"
                    }}
                ></div>
            ),
            actions:
                response.list[0] &&
                response.list[0].answer_mark &&
                (response.list[0].compatibility < 0.9 || sendValue.length < 10)
                    ? (sendValue.length > 10 ||
                          response.list[0].compatibility < 0.9) &&
                      list.length <= 1
                        ? null
                        : [
                              <Fragment>
                                  {sendValue.length < 10 &&
                                      response.list[0].compatibility > 0.9 && (
                                          <div>
                                              <div>匹配问题：</div>

                                              {list.length ? (
                                                  <div
                                                      key={
                                                          "comment-list-reply-to-" +
                                                          -1
                                                      }
                                                  >
                                                      <span>{}</span>
                                                      <a
                                                          onClick={() => {
                                                              this.handleSend(
                                                                  list[0]
                                                                      .question_standard
                                                              )
                                                          }}
                                                      >
                                                          {
                                                              list[0]
                                                                  .question_standard
                                                          }
                                                      </a>
                                                  </div>
                                              ) : (
                                                  <a>
                                                      没猜到哦！请输入详细信息。
                                                  </a>
                                              )}
                                          </div>
                                      )}

                                  {list.length > 1 && (
                                      <div>
                                          <div>猜你想问：</div>

                                          {list.length > 1 ? (
                                              list.map((data, item) => {
                                                  if (item != 0)
                                                      return (
                                                          <div
                                                              key={
                                                                  "comment-list-reply-to-" +
                                                                  item
                                                              }
                                                          >
                                                              <span>
                                                                  {item + "."}
                                                              </span>
                                                              <a
                                                                  onClick={() => {
                                                                      this.handleSend(
                                                                          data.question_standard
                                                                      )
                                                                  }}
                                                              >
                                                                  {
                                                                      data.question_standard
                                                                  }
                                                              </a>
                                                          </div>
                                                      )
                                              })
                                          ) : (
                                              <a>没猜到哦！请输入详细信息。</a>
                                          )}
                                      </div>
                                  )}
                              </Fragment>
                          ]
                    : null,
            id: this.state.data.length + 1,
            role: "my"
        })

        setTimeout(() => {
            card.scrollTop = card.scrollHeight
        }, 100)
        console.log(this.state.data)
        this.setState({ data: this.state.data, isSpin: false })
    }

    renderFooter() {
        const { sendValue } = this.state
        return (
            <Row
                gutter="24"
                style={{ margin: "0px 0px", height: "32px", width: "100%" }}
            >
                <Col lg={21}>
                    <Input
                        value={this.state.sendValue}
                        onChange={e => {
                            this.setState({ sendValue: e.target.value })
                        }}
                        placeholder={"请输入消息".toString()}
                        onPressEnter={this.handleSend.bind(this, sendValue)}
                        disabled={this.state.action}
                    ></Input>
                </Col>
                <Col lg={3}>
                    <Button
                        disabled={this.state.action}
                        type="primary"
                        onClick={this.handleSend.bind(this, sendValue)}
                    >
                        发送
                    </Button>
                </Col>
            </Row>
        )
    }
    render() {
        return (
            <Fragment>
                <Spin tip="回答中。。。" spinning={this.state.isSpin}>
                    <Card
                        bordered={null}
                        style={{
                            margin: "-24px",
                            height: "500px",
                            overflow: "scroll",
                            overflowX: "hidden"
                        }}
                        ref={"card"}
                        id="card"
                    >
                        <CharRecords
                            status={0 && 1 ? "ongoing" : ""}
                            goingTip={"暂无数据"}
                            iconMy={<Avatar src={rebotSvg} />}
                            iconInterlocutors={<Avatar src={mySvg} />}
                            value={this.state.data}
                        ></CharRecords>
                    </Card>
                    {this.renderFooter()}
                </Spin>
            </Fragment>
        )
    }
}

export default Dialogue
