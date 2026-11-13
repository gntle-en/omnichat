import React from 'react';
import { Box, config } from 'folds';
import { Page, PageHero, PageHeroSection } from '../../components/page';
import CinnySVG from '../../../../public/res/svg/cinny.svg';

export function WelcomePage() {
  return (
    <Page>
      <Box
        grow="Yes"
        style={{ padding: config.space.S400, paddingBottom: config.space.S700 }}
        alignItems="Center"
        justifyContent="Center"
      >
        <PageHeroSection>
          <PageHero
            icon={<img width="70" height="70" src={CinnySVG} alt="OmniChat Logo" />}
            title="Welcome to OmniChat"
            subTitle={
              <span>
                The good Matrix client.{' '}
                <a
                  href="https://github.com/gntle-en/omnichat/releases"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  v4.12.8
                </a>
              </span>
            }
          />
        </PageHeroSection>
      </Box>
    </Page>
  );
}
