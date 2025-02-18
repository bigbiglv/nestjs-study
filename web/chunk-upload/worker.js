self.onmessage = function (e) {
  const { file, chunkSize, totalCount } = e.data;
  const chunks = [];

  for (let i = 0; i < totalCount; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    chunks.push({
      index: i,
      chunk: file.slice(start, end, file.type),
    });
  }

  // 传回主线程
  self.postMessage(chunks);
};
