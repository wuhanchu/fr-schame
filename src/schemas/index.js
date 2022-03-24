import project from "./project"
import question from "./question"
import domain from "./domain"
import story from "./story"
import synonym from "./synonym"
import intent from "./intent"
import entity from "./entity"
import mark from "./mark"

import entityAttr from "./entityType/attribute"
import entityType from "./entityType"
import hotWord from "./domain/hotWord"
import task from "./domain/task"
import outboundTask from "./outboundTask/index"
import response from "./response"

import searchHistory from "./domain/searchHistory"

import relation from "./relation"
import relationType from "./relationType"
import flow from "./flow"
import statistics from "./statistics"

export default {
    project,
    statistics,
    question,
    domain,
    story,
    entityAttr,
    synonym,
    intent,
    entity,
    entityType,
    hotWord,
    relation,
    response,
    relationType,
    task,
    flow,
    mark,
    searchHistory,
    outboundTask,
}
