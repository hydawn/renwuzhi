// Function to extract image as a Blob from an already loaded img element
function getImageBlobFromImg(img, imgType) {
  return new Promise((resolve, reject) => {
    // Create an off-screen canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Set canvas dimensions to the image's natural dimensions
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    // Draw the image onto the canvas
    ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);

    // Extract the image as a Blob
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob); // Resolve the promise with the Blob
      } else {
        reject(new Error('Failed to extract image as Blob'));
      }
    }, `image/${imgType}`);
  });
}

// Function to bundle images into a ZIP and provide a download link
async function downloadImagesAsZip(did, onLoad) {
  function getSuffix(url) {
    const iUrl = (new URL(url));
    // console.log(iUrl)
    return iUrl.pathname.substring(iUrl.pathname.lastIndexOf('.') + 1)
  }
  function sanitizeFilename(filename) {
    // Replace any invalid characters with an empty string
    return filename.replace(/[<>:"/\\|?*]+/g, '');
  }

  // Create a new JSZip instance
  const zip = new JSZip();

  // Select all image elements
  const images = document.querySelectorAll('.gallery img');
  const total_image = images.length;
  let bar = initProgressingBar(total_image, "progressing-bar");

  // Loop through all images and add them to the ZIP
  let imagePromises = Array.from(images).map(async (img, index) => {
    const imgUrl = img.src; // Image URL
    const fileName = `${sanitizeFilename(img.name)}-${index + 1}.${getSuffix(imgUrl)}`; // Set file name

    function zipIt(blob) {
      bar.more();
      zip.file(fileName, blob); // Add the image blob to the ZIP
    }

    // Fetch and add the image to the ZIP, skip if already loaded
    if (img.complete && img.naturalWidth > 0) {
      zipIt(await getImageBlobFromImg(img, getSuffix(imgUrl)));
    } else {
      zipIt(await fetch(imgUrl).then(response => response.blob()));
    }
  });

  // Once all images are added, generate the ZIP and create a download link
  try {
    await Promise.all(imagePromises);

    // Generate the ZIP file as a blob
    const content = await zip.generateAsync({ type: 'blob' });
    onLoad();

    // Create a download link for the ZIP file
    //const link = document.createElement('a');
    const link = document.getElementById(did);
    link.href = URL.createObjectURL(content); // Create object URL for the ZIP
    link.download = 'images.zip'; // Set the download file name
    link.click(); // Trigger the download
  } catch (error) {
    console.error("Error downloading images:", error);
  }
}

// Call the function to download the images as a ZIP
//downloadImagesAsZip();
function handleClickDownloadImage() {
  hideElement('hit_download_images_button')
  showElement('loading-from-image')
  // setTimeout(() => {
  downloadImagesAsZip('hit_download_images', () => {
    hideElement('loading-from-image')
    showElement('hit_download_links')
  })
  // }, 2000);
}
