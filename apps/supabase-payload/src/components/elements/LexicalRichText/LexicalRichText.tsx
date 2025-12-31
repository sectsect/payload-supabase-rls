/* eslint-disable react/no-unstable-nested-components */
import type { PayloadLexicalReactRendererContent } from '@atelier-disko/payload-lexical-react-renderer';
import {
  PayloadLexicalReactRenderer,
  defaultElementRenderers,
} from '@atelier-disko/payload-lexical-react-renderer';
import { match } from 'ts-pattern';

import { tailwindClass } from '@/utils/tailwindcss';

interface Props {
  content: PayloadLexicalReactRendererContent;
}

const LexicalRichText = ({ content }: Props) => {
  // content.root.children.map(node => {
  //   console.log(node);
  // });

  return (
    <PayloadLexicalReactRenderer
      content={content}
      elementRenderers={{
        ...defaultElementRenderers,
        heading: props => {
          const Tag = props.tag as React.ElementType;
          const additionalClassName = match(props.tag)
            .with('h1', () => 'text-4xl')
            .with('h2', () => 'text-3xl')
            .with('h3', () => 'text-2xl')
            .with('h4', () => 'text-xl')
            .with('h5', () => 'text-lg')
            .with('h6', () => 'text-base')
            .otherwise(() => null);
          return (
            <Tag className={tailwindClass('font-bold', additionalClassName)}>
              {props.children}
            </Tag>
          );
        },
        paragraph: props => <p className="text-lg">{props.children}</p>,
        quote: props => (
          <blockquote className="border-l-4 border-gray-300 pl-3 text-gray-500">
            {props.children}
          </blockquote>
        ),
        list: props => {
          const Tag = props.tag as React.ElementType;
          const className = props.tag === 'ul' ? 'list-disc' : 'list-decimal';
          return (
            <Tag className={tailwindClass('list-inside', className)}>
              {props.children}
            </Tag>
          );
        },
        listItem: props => <li className="text-base">{props.children}</li>,
      }}
    />
  );
};

export default LexicalRichText;
