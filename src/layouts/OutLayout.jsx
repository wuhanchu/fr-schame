/**
 * Ant Design Pro v4 use `@ant-design/pro-layout` to handle Layout.
 * You can view component api by:
 * https://github.com/ant-design/ant-design-pro-layout
 */
import ProLayout, { DefaultFooter } from "@ant-design/pro-layout"
import React, { useEffect } from "react"
import { connect, Link, useIntl } from "umi"
import { Button, Result } from "antd"
import { PageHeaderWrapper } from "@ant-design/pro-layout"

import Authorized from "../components/Authorized/Authorized"

const config = SETTING
const Page = () => (
    <PageHeaderWrapper title={false}>this is a page</PageHeaderWrapper>
)

console.log(config)

/**
 * use Authorized check all menu item
 */
const menuDataRender = (menuList) =>
    menuList.map((item) => {
        const localItem = {
            ...item,
            children: item.children ? menuDataRender(item.children) : [],
        }
        return Authorized.check(item.authority, localItem, null)
    })

const defaultFooterDom = (
    <DefaultFooter copyright={config.copyright || ""} links={[]} />
)

const BasicLayout = (props) => {
    const {
        dispatch,
        children,
        settings,
        init,
        initCallback,

        location = {
            pathname: "/",
        },
    } = props
    /**
     * constructor
     */
    console.log(children)
    console.log(init)

    useEffect(() => {
        if (dispatch) {
            dispatch({
                type: "global/init",
            })
        }
    }, [])

    useEffect(() => {
        initCallback && initCallback()
    }, [init])

    const { formatMessage } = useIntl()

    console.log(props)
    return (
        <ProLayout
            formatMessage={formatMessage}
            hide={true}
            // {...props}
            {...settings}
            {...{
                navTheme: "light",
                layout: "mix",
                contentWidth: "Fluid",
                fixedHeader: false,
                fixSiderbar: false,
                menu: {
                    locale: true,
                },
                headerRender: false,
                footerRender: false,
                menuHeaderRender: false,
            }}
            title="知料"
            // loading={true}
        >
            <div>{children}</div>
        </ProLayout>
    )
}

export default connect(({ global, settings }) => ({
    collapsed: global.collapsed,
    init: global.init,
    settings,
}))(BasicLayout)
