const fs = require('fs')
const path = require('path')

fs.promises.readdir(path.join(__dirname, '../packages')).then(async (dirs) => {
  const packages = dirs.filter((dir) => !dir.startsWith('.'))
  const badges = packages.map((pkg) => {
    const pkgPath = path.join(__dirname, '../packages', pkg)
    const pkgJson = require(path.join(pkgPath, 'package.json'))
    const pkgName = pkgJson.name
    const badge = `[![${pkgName}](https://img.shields.io/npm/v/${pkgName}.svg?style=flat-square&label=${encodeURIComponent(pkgName)})](https://www.npmjs.com/package/${pkgName})`
    return badge
  })
  const readmePath = path.join(__dirname, '../README.md')
  const readmeContent = await fs.promises.readFile(readmePath, 'utf-8')
  const newReadme = readmeContent.replace(/<!-- BADGES -->[\s\S\n]*<!-- BADGES END -->/, `<!-- BADGES -->\n${badges.join('  \n')}\n<!-- BADGES END -->`)
  await fs.promises.writeFile(readmePath, newReadme)
  console.log('✅ generate badges success!')
})
