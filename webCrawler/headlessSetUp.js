import Xvfb from 'xvfb'

// XVFB FOR LINUX DEVICES
export async function startXvfb () {
  const XVFB = new Xvfb({
    silent: true,
    xvfb_args: ['-screen', '0', '2800x1800x24']
  })

  return new Promise((resolve, reject) => {
    XVFB.start((error) => {
      if (error) { reject(error) }
      resolve(XVFB)
    })
  })
}

export async function stopXvfb (XVFB) {
  return new Promise((resolve, reject) => {
    XVFB.stop((error) => {
      if (error) { reject(error) }
      resolve(error)
    })
  })
}