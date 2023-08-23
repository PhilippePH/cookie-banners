export async function getScreenshot (page, resultPath, siteName) {
  // Screenshot
  try {
    await page.screenshot({
      path: resultPath + `/screenshots/${siteName}.jpeg`,
      type: 'jpeg',
      quality: 25
    })
  } catch (error) {
    console.log('Error with the screenshot')
    console.log(error)
  }
}
