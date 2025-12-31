'use client';

import { useState } from 'react';

import Image from 'next/image';
import type SwiperCore from 'swiper';
import { Navigation, Pagination, Thumbs } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

import type { SliderBlock } from '@/payload-types';

interface Props {
  block: SliderBlock;
}

const BlockSlider = ({ block }: Props) => {
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperCore>();

  const { slider } = block;

  if (!slider || slider.length === 0) {
    return null;
  }

  const isSingleSlide = slider.length === 1;

  return (
    <>
      <Swiper
        modules={[Navigation, Pagination, Thumbs]}
        thumbs={{ swiper: thumbsSwiper }}
        spaceBetween={20}
        slidesPerView={1}
        loop
        navigation={{
          prevEl: '.prev',
          nextEl: '.next',
        }}
        pagination={
          !isSingleSlide
            ? {
                el: '.pagination',
                type: 'fraction',
              }
            : false
        }
        onSlideChange={swiper => {
          const { realIndex } = swiper;
          // eslint-disable-next-line no-console
          console.log(realIndex);
        }}
      >
        {slider.map(slide => {
          const { id, image, caption } = slide;

          if (typeof image !== 'object') {
            return null;
          }

          const { url: src, width, height, alt } = image;

          const hasImage = !!(src && width && height);

          if (!hasImage) {
            return null;
          }

          return (
            <SwiperSlide key={id}>
              <Image
                src={src}
                width={width}
                height={height}
                alt={alt}
                sizes="100vw"
                className="h-auto w-full"
              />
              {caption && (
                <p className="mt-3 text-sm text-gray-500 md:mt-4">{caption}</p>
              )}
            </SwiperSlide>
          );
        })}

        {!isSingleSlide && (
          <div className="relative flex items-center justify-center md:mt-3">
            <button
              type="button"
              aria-label="Previous"
              className="prev !block p-3 outline-none"
            >
              prev
            </button>

            <div className="pagination mx-2 !w-auto text-sm font-bold leading-normal" />

            <button
              type="button"
              aria-label="Next"
              className="next !block p-3 outline-none"
            >
              next
            </button>
          </div>
        )}
      </Swiper>

      {!isSingleSlide && (
        <Swiper
          onSwiper={setThumbsSwiper}
          spaceBetween={12}
          slidesPerView={3}
          watchSlidesProgress
          modules={[Navigation, Thumbs]}
          breakpoints={{
            768: {
              slidesPerView: 5,
              spaceBetween: 24,
            },
          }}
          className="!pb-1 !pt-2 md:!pb-0 md:!pt-4"
        >
          {slider.map(slide => {
            const { id, image } = slide;

            if (typeof image !== 'object') {
              return null;
            }

            const { url: src, width, height, alt } = image;

            const hasImage = !!(src && width && height);

            if (!hasImage) {
              return null;
            }

            return (
              <SwiperSlide key={id}>
                <Image
                  src={src}
                  width={width}
                  height={height}
                  alt={alt}
                  sizes="(max-width: 768px) calc(100vw - 32px - 24px), 262px"
                  className="h-auto w-full"
                />
              </SwiperSlide>
            );
          })}
        </Swiper>
      )}
    </>
  );
};

export default BlockSlider;
