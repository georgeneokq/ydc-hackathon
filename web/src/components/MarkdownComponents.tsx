import React from 'react';

export const markdownComponents = {
  h1: ({node, ...props}: any) => <h1 className="text-2xl font-bold mt-6 mb-4" {...props} />,
  h2: ({node, ...props}: any) => <h2 className="text-xl font-bold mt-5 mb-3" {...props} />,
  h3: ({node, ...props}: any) => <h3 className="text-lg font-bold mt-4 mb-2" {...props} />,
  h4: ({node, ...props}: any) => <h4 className="text-base font-bold mt-3 mb-2" {...props} />,
  p: ({node, ...props}: any) => <p className="mb-3 text-gray-700" {...props} />,
  ul: ({node, ...props}: any) => <ul className="list-disc pl-6 mb-3" {...props} />,
  ol: ({node, ...props}: any) => <ol className="list-decimal pl-6 mb-3" {...props} />,
  li: ({node, ...props}: any) => <li className="mb-1" {...props} />,
  blockquote: ({node, ...props}: any) => <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600" {...props} />,
  code: ({node, ...props}: any) => <code className="bg-gray-100 rounded px-1 py-0.5 text-sm" {...props} />,
  pre: ({node, ...props}: any) => <pre className="bg-gray-100 p-4 rounded overflow-x-auto my-3" {...props} />,
  strong: ({node, ...props}: any) => <strong className="font-bold" {...props} />,
  em: ({node, ...props}: any) => <em className="italic" {...props} />,
  a: ({node, ...props}: any) => <a className="text-blue-600 hover:underline" {...props} />,
  hr: ({node, ...props}: any) => <hr className="my-4 border-gray-300" {...props} />,
  table: ({node, ...props}: any) => (
    <table className="min-w-full border-collapse border border-gray-300 mb-4" {...props} />
  ),
  thead: ({node, ...props}: any) => (
    <thead className="bg-gray-50" {...props} />
  ),
  tbody: ({node, ...props}: any) => (
    <tbody className="bg-white" {...props} />
  ),
  tr: ({node, ...props}: any) => (
    <tr className="border-b border-gray-300" {...props} />
  ),
  th: ({node, ...props}: any) => (
    <th 
      className="border border-gray-300 px-4 py-2 text-left font-semibold bg-gray-100 text-gray-700" 
      {...props} 
    />
  ),
  td: ({node, ...props}: any) => (
    <td 
      className="border border-gray-300 px-4 py-2 text-gray-700" 
      {...props} 
    />
  )
};