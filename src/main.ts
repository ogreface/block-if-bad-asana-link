import * as core from '@actions/core'
import * as github from '@actions/github'

export async function containsSentinelValue(
  prText: string,
  sentinelValue: string
): Promise<boolean> {
  return prText.includes(sentinelValue)
}

export async function containsRegexValue(
  prText: string,
  regexValue: string
): Promise<boolean> {
  const regex = new RegExp(regexValue)
  return regex.test(prText)
}

async function run(): Promise<void> {
  try {
    const sentinel: string = core.getInput('sentinel')
    core.debug(`Looking for ${sentinel}, will fail if found`) // debug is only output if you set the secret `ACTIONS_STEP_DEBUG` to true
    const prText: string =
      github?.context?.payload?.pull_request?.body || 'fail'
    core.debug(`PR text is ${prText}`)
    const sentinelFound = await containsSentinelValue(prText, sentinel)
    core.debug(`Sentinel status is ${sentinelFound}`)

    if (sentinelFound) {
      core.setFailed(`$sentinel is present`)
    } else {
      const regex: string = core.getInput('regex')
      core.debug(`Looking for ${regex}, will succeed if found`)
      const regexFound = await containsRegexValue(prText, regex)
      if (!regexFound) {
        core.setFailed(`${regex} is not present.`)
      }
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
