import {log} from "util";
import {containsRegexValue, containsSentinelValue} from "../src/main";
import {wait} from '../src/wait'
import * as process from 'process'
import * as cp from 'child_process'
import * as path from 'path'
import {expect, test, afterEach, beforeAll, jest} from '@jest/globals'
import * as core from '@actions/core'
import * as github from '@actions/github'

// Shallow clone original @actions/github context
let originalContext = { ...github.context }
let inputs = {
  sentinel: "findme.fake.com",
  regex: 'https:\\/\\/app\\.fake\\.com/\\d/\\d+/\\d+/.'
} as any

beforeAll(() => {
// Mock getInput
  jest.spyOn(core, 'getInput').mockImplementation((name: string) => {
    return inputs[name]
  })
})

afterEach(() => {
  // Restore original @actions/github context
  Object.defineProperty(github, 'context', {
    value: originalContext,
  });
})

function buildPullRequest(bodyText:string) {
  // Mock the @actions/github context.
  Object.defineProperty(github, 'context', {
    value: {
      payload: {
        pull_request: {
         body: bodyText,
        },
      },
    },
  });
}

test('sentinel does not exist', async() => {
  buildPullRequest("This is a test body without the sentinel")
  const prText = github?.context?.payload?.pull_request?.body || ""
  let sentinel = core.getInput('sentinel')
  const result = await containsSentinelValue(prText, sentinel)
  expect(result).toBeFalsy()
})

test('sentinel does exist', async() => {
  buildPullRequest("This is a test body with the sentinel.\n We may have a link like https://findme.fake.com")
  // @ts-ignore
  let {body: prText} = github.context.payload.pull_request
  let sentinel = core.getInput('sentinel')
  const result = await containsSentinelValue(prText, sentinel)
  expect(result).toBeTruthy()
})

test('regex to match does exist', async() => {
  buildPullRequest("This is a test body with the sentinel.\n We may have a link like https://app.fake.com/0/120320926/120320926/f")
  // @ts-ignore
  let {body: prText} = github.context.payload.pull_request
  let regex = core.getInput('regex')
  const result = await containsRegexValue(prText, regex)
  expect(result).toBeTruthy()
})

test('regex to match does not exist', async() => {
  buildPullRequest("This is a test body with the sentinel.\n We may have a link like https://app.fake.com/FAIL/0/120320926/120320926/f")
  // @ts-ignore
  let {body: prText} = github.context.payload.pull_request
  let regex = core.getInput('regex')
  const result = await containsRegexValue(prText, regex)
  expect(result).toBeFalsy()
})