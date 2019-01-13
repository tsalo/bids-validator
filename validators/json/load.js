const utils = require('../../utils')

function validate(resolve, reject, file, jsonFiles, jsonContentsDict, issues) {
  return function(parseIssues, jsObj) {
    issues = issues.concat(parseIssues)

    // abort further tests if schema test does not pass
    if (issues.some(issue => issue.severity === 'error')) {
      return reject()
    }

    jsonContentsDict[file.relativePath] = jsObj
    jsonFiles.push(file)
    resolve()
  }
}

const load = (files, jsonFiles, jsonContentsDict, annexed, dir) => {
  let issues = []
  const jsonPromises = files.map(function(file) {
    return utils.limit(
      () =>
        new Promise((resolve, reject) => {
          utils.files
            .readFile(file, annexed, dir)
            .then(contents => {
              utils.json.parse(
                file,
                contents,
                validate(
                  resolve,
                  reject,
                  file,
                  jsonFiles,
                  jsonContentsDict,
                  issues,
                ),
              )
            })
            .catch(issue => {
              issues.push(issue)
              resolve()
            })
        }),
    )
  })
  return new Promise(resolve =>
    Promise.all(jsonPromises)
      .then(() => resolve(issues))
      .catch(() => resolve(issues)),
  )
}

module.exports = load
