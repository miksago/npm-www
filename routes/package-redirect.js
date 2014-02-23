module.exports = packageRedirect

var url = require('url')

function packageRedirect (req, res) {
  var name = req.params.name
  , type = req.params.type

  req.model.load('package', req.params)

  req.model.end(function (er, m) {
    if (er && er.code === 'E404') return res.error(404, er)
    if (er) return res.error(er)
    if (!m.package) return res.error(404)
    // We are catching this one very late in the application
    // as the npm-client will have cached this response as json
    // and we are not getting a valid http error code in that case
    if (m.package.error === 'not_found') return res.error(404)

    if (type === 'homepage') return handleHomepage(req, res, m)
    if (type === 'repo') return handleRepo(req, res, m)

    res.error(404)
  })
}

function handleHomepage (req, res, m) {
  var p = m.package

  if (p.homepage) return res.redirect(p.homepage)
  res.redirect('/package/' + p.name)
}

function handleRepo (req, res, m) {
  var p = m.package
  , fallbackUrl = '/package/' + p.name

  if (!p.repository || !p.repository.url) return res.redirect(fallbackUrl)

  var parsed = url.parse(p.repository.url)
  var redirectTo
  
  switch (parsed.hostname) {
    case 'github.com':
      redirectTo = formatUrl('github.com', parsed.path)
      break
    case 'bitbucket.com':
      redirectTo = formatUrl('bitbucket.com', parsed.path)
      break
    default:
      // This case tends to be reached if the repository url is a SSH url,
      // in this case, play dumb and just redirect to the package page
      redirectTo = fallbackUrl
      break
  }

  res.redirect(redirectTo);
}

function formatUrl(hostname, path){
  return url.format({
    protocol: 'https',
    hostname: hostname,
    pathname: path.replace(/\.git$/g, '')
  })
}
