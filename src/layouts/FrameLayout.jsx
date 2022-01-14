/**
 * Ant Design Pro v4 use `@ant-design/pro-layout` to handle Layout.
 * You can view component api by:
 * https://github.com/ant-design/ant-design-pro-layout
 */
import ProLayout, { DefaultFooter } from "@ant-design/pro-layout"
import React, { useEffect } from "react"
import { connect, Link, useIntl } from "umi"
import { Button, Result } from "antd"
import RightContent from "@/outter/fr-schema-antd-utils/src/components/GlobalHeader/RightContent"

import logo from "@/assets/logo.svg"

import Authorized from "@/outter/fr-schema-antd-utils/src/components/Authorized/Authorized"

const config = SETTING
const noMatch = (
    <Result
        status={403}
        title="403"
        subTitle="Sorry, you are not authorized to access this page."
        extra={
            <Button type="primary">
                <Link to="/user/login">Go Login</Link>
            </Button>
        }
    />
)

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

    /**
     * init variables
     */

    const handleMenuCollapse = (payload) => {
        if (dispatch) {
            dispatch({
                type: "global/changeLayoutCollapsed",
                payload,
            })
        }
    } // get children authority

    const { formatMessage } = useIntl()

    return (
        <ProLayout
            //  logo={logo}
            style={{ height: "calc(100% - 48px)" }}
            formatMessage={formatMessage}
            menuHeaderRender={false}
            headerRender={false}
            onCollapse={handleMenuCollapse}
            menuItemRender={(menuItemProps, defaultDom) => {
                if (
                    menuItemProps.isUrl ||
                    menuItemProps.children ||
                    !menuItemProps.path
                ) {
                    return defaultDom
                }

                return <Link to={menuItemProps.path}>{defaultDom}</Link>
            }}
            breadcrumbRender={(routers = []) => [
                {
                    path: "/",
                    breadcrumbName: formatMessage({
                        id: "menu.home",
                    }),
                },
                ...routers,
            ]}
            itemRender={(route, params, routes, paths) => {
                const first = routes.indexOf(route) === 0
                return first ? (
                    <Link to={paths.join("/")}>{route.breadcrumbName}</Link>
                ) : (
                    <span>{route.breadcrumbName}</span>
                )
            }}
            footerRender={() => false}
            menuDataRender={menuDataRender}
            rightContentRender={() => <></>}
            {...props}
            {...settings}
            layout={"leftmenu"}
            loading={!init}
        >
            {children}
        </ProLayout>
    )
}

export default connect(({ global, settings }) => ({
    collapsed: global.collapsed,
    init: global.init,
    settings,
}))(BasicLayout)
